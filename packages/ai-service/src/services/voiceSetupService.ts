import { v4 as uuidv4 } from 'uuid';
import openai from '../config/openai';
import pool from '../config/database';

interface SessionData {
  familySize?: number;
  children?: Array<{ name: string; age: number }>;
  houseType?: string;
  bedrooms?: number;
  hasBackyard?: boolean;
  hasPets?: boolean;
  pets?: string[];
}

interface VoiceSetupSession {
  sessionId: string;
  userId: string;
  extractedData: SessionData;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  isComplete: boolean;
}

// In-memory session store (use Redis in production)
const sessions = new Map<string, VoiceSetupSession>();

const SYSTEM_PROMPT = `You are a friendly family assistant helping set up a chore management app. Your goal is to gather the following information through natural conversation:

1. How many people are in the family
2. Names and ages of children
3. Type of home (house, apartment, condo, etc.)
4. Number of bedrooms
5. Whether they have a backyard
6. Whether they have pets (and what kind)

Be conversational, warm, and encouraging. Ask one or two questions at a time. Confirm information before moving on. When you have all the information, summarize it and ask for confirmation.

After each user response, you must return a JSON object in your response with the following structure:
{
  "extracted_data": {
    "family_size": number or null,
    "children": [{"name": string, "age": number}] or null,
    "house_type": string or null,
    "bedrooms": number or null,
    "has_backyard": boolean or null,
    "has_pets": boolean or null,
    "pets": [string] or null
  },
  "next_question": "Your conversational response and next question",
  "is_complete": boolean
}`;

export class VoiceSetupService {
  async processVoiceInput(sessionId: string | null, textInput: string, userId: string) {
    let session: VoiceSetupSession;

    if (!sessionId || !sessions.has(sessionId)) {
      // Create new session
      session = {
        sessionId: uuidv4(),
        userId,
        extractedData: {},
        conversationHistory: [],
        isComplete: false
      };
      sessions.set(session.sessionId, session);
    } else {
      session = sessions.get(sessionId)!;
    }

    // Add user message to history
    session.conversationHistory.push({ role: 'user', content: textInput });

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...session.conversationHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }))
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const assistantMessage = response.choices[0]?.message?.content || '';

      // Try to parse the JSON response
      let parsedResponse;
      try {
        // Extract JSON from the response
        const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // If JSON parsing fails, use the raw response
        parsedResponse = {
          extracted_data: session.extractedData,
          next_question: assistantMessage,
          is_complete: false
        };
      }

      // Update session with extracted data
      if (parsedResponse.extracted_data) {
        session.extractedData = {
          ...session.extractedData,
          ...Object.fromEntries(
            Object.entries(parsedResponse.extracted_data).filter(([, v]) => v !== null)
          )
        };
      }

      session.isComplete = parsedResponse.is_complete || false;

      // Add assistant response to history
      session.conversationHistory.push({
        role: 'assistant',
        content: parsedResponse.next_question || assistantMessage
      });

      // If complete, save to database
      if (session.isComplete) {
        await this.saveSetupData(session);
      }

      return {
        sessionId: session.sessionId,
        action: session.isComplete ? 'setup_complete' : 'continue_conversation',
        extractedData: session.extractedData,
        responseText: parsedResponse.next_question || assistantMessage,
        isComplete: session.isComplete
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to process voice input');
    }
  }

  private async saveSetupData(session: VoiceSetupSession) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get user's family ID
      const userResult = await client.query(
        'SELECT family_id FROM users WHERE user_id = $1',
        [session.userId]
      );

      if (userResult.rows.length > 0 && userResult.rows[0].family_id) {
        const familyId = userResult.rows[0].family_id;

        // Update family with house details
        await client.query(
          `UPDATE families SET
           house_type = $1,
           house_details = $2
           WHERE family_id = $3`,
          [
            session.extractedData.houseType,
            JSON.stringify({
              bedrooms: session.extractedData.bedrooms,
              hasBackyard: session.extractedData.hasBackyard,
              hasPets: session.extractedData.hasPets,
              pets: session.extractedData.pets
            }),
            familyId
          ]
        );

        // Add children if extracted
        if (session.extractedData.children) {
          for (const child of session.extractedData.children) {
            const childId = uuidv4();
            await client.query(
              `INSERT INTO users (user_id, first_name, role, family_id, age)
               VALUES ($1, $2, 'child', $3, $4)`,
              [childId, child.name, familyId, child.age]
            );

            await client.query(
              `INSERT INTO family_members (family_id, user_id, role, nickname)
               VALUES ($1, $2, 'child', $3)`,
              [familyId, childId, child.name]
            );
          }
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Clean up session
    sessions.delete(session.sessionId);
  }

  getSession(sessionId: string) {
    return sessions.get(sessionId);
  }
}

export default new VoiceSetupService();
