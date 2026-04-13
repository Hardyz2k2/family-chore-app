# API Specifications: Family Chore Management App

**Author:** Manus AI
**Date:** January 20, 2026

## 1. Introduction

This document provides a detailed specification for the RESTful API of the family chore management application. The API is designed to be used by the mobile client and provides endpoints for all core functionalities. All endpoints are secured and require authentication, unless otherwise specified.

## 2. Base URL

`https://api.yourdomain.com/v1`

## 3. Authentication

Authentication is handled via JSON Web Tokens (JWT). The client must include the JWT in the `Authorization` header of all authenticated requests:

`Authorization: Bearer <jwt_token>`

## 4. API Endpoints

--- 

### User & Authentication Service

**1. Register User**
*   **Method:** `POST`
*   **Path:** `/auth/register`
*   **Description:** Creates a new parent user account.
*   **Request Body:**
    ```json
    {
      "email": "parent@example.com",
      "password": "strongpassword123",
      "first_name": "John",
      "last_name": "Doe"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "user_id": "uuid-goes-here",
      "email": "parent@example.com",
      "token": "jwt-token-goes-here"
    }
    ```

**2. Login User**
*   **Method:** `POST`
*   **Path:** `/auth/login`
*   **Description:** Authenticates a user and returns a JWT.
*   **Request Body:**
    ```json
    {
      "email": "parent@example.com",
      "password": "strongpassword123"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "user_id": "uuid-goes-here",
      "email": "parent@example.com",
      "token": "jwt-token-goes-here"
    }
    ```

--- 

### Family Service

**3. Create Family**
*   **Method:** `POST`
*   **Path:** `/families`
*   **Description:** Creates a new family and associates the current user as the first parent.
*   **Request Body:**
    ```json
    {
      "family_name": "The Doe Family",
      "house_type": "apartment"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "family_id": "uuid-goes-here",
      "family_name": "The Doe Family"
    }
    ```

**4. Add Child Member**
*   **Method:** `POST`
*   **Path:** `/families/{family_id}/members`
*   **Description:** Adds a new child member to the family.
*   **Request Body:**
    ```json
    {
      "first_name": "Jane",
      "nickname": "Janie",
      "age": 8,
      "emoji": "😊"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "user_id": "child-uuid-goes-here",
      "first_name": "Jane",
      "nickname": "Janie"
    }
    ```

**5. Get Family Details**
*   **Method:** `GET`
*   **Path:** `/families/{family_id}`
*   **Description:** Retrieves details for a specific family, including members.
*   **Response (200 OK):**
    ```json
    {
      "family_id": "uuid-goes-here",
      "family_name": "The Doe Family",
      "members": [
        { "user_id": "parent-uuid", "first_name": "John", "role": "parent" },
        { "user_id": "child-uuid", "nickname": "Janie", "role": "child", "age": 8 }
      ]
    }
    ```

--- 

### Chore Service

**6. Create Chore**
*   **Method:** `POST`
*   **Path:** `/chores`
*   **Description:** Creates a new chore in the family's master list.
*   **Request Body:**
    ```json
    {
      "family_id": "family-uuid-goes-here",
      "chore_name": "Wash the dishes",
      "description": "Load and run the dishwasher.",
      "frequency": "daily",
      "difficulty": "medium",
      "points": 20
    }
    ```
*   **Response (201 Created):** The created chore object.

**7. Assign Chore**
*   **Method:** `POST`
*   **Path:** `/chores/assign`
*   **Description:** Assigns a chore to a specific user.
*   **Request Body:**
    ```json
    {
      "chore_id": "chore-uuid-goes-here",
      "user_id": "child-uuid-goes-here",
      "due_date": "2026-01-27"
    }
    ```
*   **Response (201 Created):** The assigned chore object.

**8. Update Chore Status**
*   **Method:** `PATCH`
*   **Path:** `/chores/assigned/{assigned_chore_id}`
*   **Description:** Updates the status of an assigned chore (e.g., to 'completed').
*   **Request Body:**
    ```json
    {
      "status": "completed",
      "proof_image_url": "https://s3.aws.com/bucket/proof.jpg"
    }
    ```
*   **Response (200 OK):** The updated assigned chore object.

**9. Get Chores for User**
*   **Method:** `GET`
*   **Path:** `/users/{user_id}/chores`
*   **Description:** Retrieves all chores assigned to a specific user.
*   **Response (200 OK):** An array of assigned chore objects.

--- 

### AI Service

**10. Process Voice Setup**
*   **Method:** `POST`
*   **Path:** `/ai/voice-setup`
*   **Description:** Processes transcribed text from the voice setup conversation.
*   **Request Body:**
    ```json
    {
      "session_id": "session-uuid",
      "text_input": "We are a family of 4. My kids are Jane, age 8, and Tom, age 12. We live in a three-bedroom apartment."
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "action": "confirm_details",
      "extracted_data": {
        "family_size": 4,
        "children": [ { "name": "Jane", "age": 8 }, { "name": "Tom", "age": 12 } ],
        "house_type": "apartment",
        "bedrooms": 3
      },
      "response_text": "Great! I have you as a family of 4 with two children, Jane (8) and Tom (12), living in a 3-bedroom apartment. Is that correct?"
    }
    ```

**11. Process House Scan**
*   **Method:** `POST`
*   **Path:** `/ai/house-scan`
*   **Description:** Receives data from the house scan and returns identified objects and rooms.
*   **Request Body:** A multipart/form-data request containing video frames or 3D mesh data.
*   **Response (200 OK):**
    ```json
    {
      "house_details": {
        "rooms": [
          { "room_type": "kitchen", "assets": ["refrigerator", "oven", "dishwasher"] },
          { "room_type": "living_room", "assets": ["sofa", "tv", "coffee_table"] }
        ]
      }
    }
    ```

--- 

### Gamification Service

**12. Get User Points**
*   **Method:** `GET`
*   **Path:** `/users/{user_id}/points`
*   **Description:** Retrieves the current point balance for a user.
*   **Response (200 OK):**
    ```json
    {
      "user_id": "child-uuid-goes-here",
      "points": 540
    }
    ```

**13. Redeem Reward**
*   **Method:** `POST`
*   **Path:** `/rewards/redeem`
*   **Description:** Redeems a reward for a user, deducting the point cost.
*   **Request Body:**
    ```json
    {
      "user_id": "child-uuid-goes-here",
      "reward_id": "reward-uuid-goes-here"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Reward redeemed successfully!",
      "new_point_balance": 440
    }
    ```

This API specification provides a comprehensive guide for building the backend services for the family chore management app. It is designed to be clear, consistent, and easily consumable by the frontend development team.
