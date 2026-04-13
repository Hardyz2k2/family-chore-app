# AWS Infrastructure & Deployment Guide: Family Chore Management App

**Author:** Manus AI
**Date:** January 20, 2026

## 1. Introduction

This document provides a step-by-step guide for setting up the required AWS infrastructure and deploying the family chore management application. It is intended for a developer or a DevOps engineer (or an AI assistant like Claude) to provision the environment. The architecture uses a combination of managed services to ensure scalability, reliability, and security.

## 2. Prerequisites

Before you begin, ensure you have the following:

*   An AWS account with administrative privileges.
*   The AWS CLI installed and configured on your local machine.
*   Docker installed on your local machine.
*   Node.js and npm installed for backend development.
*   Git installed for version control.

## 3. AWS Services Overview

This project will use the following AWS services:

| Service | Purpose |
|---|---|
| **Amazon VPC** | Provides an isolated network environment for your resources. |
| **Amazon RDS** | A managed relational database service for PostgreSQL. |
| **Amazon ECS** | A container orchestration service to run the backend microservices. |
| **AWS Fargate** | A serverless compute engine for containers. |
| **Amazon ECR** | A container registry to store your Docker images. |
| **Amazon S3** | A scalable object storage service for static assets. |
| **Amazon API Gateway** | A managed service to create, publish, and secure APIs. |
| **AWS CodePipeline** | A continuous integration and delivery service to automate deployments. |
| **AWS IAM** | Manages user access and permissions. |
| **AWS CloudFormation** | An Infrastructure as Code (IaC) service to automate provisioning. |

## 4. Infrastructure Setup (using AWS CloudFormation)

To automate the provisioning process, we will use a CloudFormation template. This template will create the VPC, subnets, security groups, RDS instance, ECS cluster, and IAM roles.

**File: `cloudformation.yaml`**

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Infrastructure for the Family Chore Management App'

Resources:
  # VPC and Networking
  VPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsSupport: true
      EnableDnsHostnames: true

  PublicSubnetA:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [ 0, !GetAZs '' ]

  # ... (Define other subnets, route tables, internet gateway, etc.)

  # Security Groups
  AppSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      VpcId: !Ref VPC
      GroupDescription: 'Allow HTTP/HTTPS traffic'
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0

  # RDS Database
  DatabaseInstance:
    Type: 'AWS::RDS::DBInstance'
    Properties:
      DBInstanceIdentifier: 'family-chore-db'
      DBInstanceClass: 'db.t3.micro'
      Engine: 'postgres'
      MasterUsername: 'admin'
      MasterUserPassword: 'yoursecurepassword'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups: [ !GetAtt AppSecurityGroup.GroupId ]
      AllocatedStorage: '20'

  # ECS Cluster
  ECSCluster:
    Type: 'AWS::ECS::Cluster'
    Properties:
      ClusterName: 'family-chore-cluster'

  # ... (Define other resources like IAM roles, ECR repositories, etc.)

Outputs:
  VpcId:
    Description: 'The ID of the VPC'
    Value: !Ref VPC
  DatabaseEndpoint:
    Description: 'The endpoint of the RDS database'
    Value: !GetAtt DatabaseInstance.Endpoint.Address
```

**Instructions for Claude:**
1.  Complete the `cloudformation.yaml` template with all necessary resources (subnets, route tables, NAT gateway, IAM roles, ECR repositories).
2.  Use the AWS CLI to deploy the stack: `aws cloudformation create-stack --stack-name family-chore-infra --template-body file://cloudformation.yaml`

## 5. Backend Deployment

### 5.1. Containerization

Each microservice (User Service, Chore Service, etc.) will be containerized using Docker. Create a `Dockerfile` for each service.

**Example `Dockerfile` for a Node.js service:**

```dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "node", "server.js" ]
```

### 5.2. Pushing to ECR

1.  Create an ECR repository for each service (this can be done in the CloudFormation template).
2.  Build the Docker image: `docker build -t <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<service_name>:latest .`
3.  Authenticate Docker with ECR: `aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com`
4.  Push the image to ECR: `docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<service_name>:latest`

### 5.3. ECS Task Definition

Create a task definition for each service in ECS. This JSON file specifies the Docker image to use, CPU/memory allocation, and environment variables.

**File: `task-definition.json`**

```json
{
  "family": "user-service-task",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "user-service",
      "image": "<aws_account_id>.dkr.ecr.<region>.amazonaws.com/user-service:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "DATABASE_URL", "value": "postgres://admin:yoursecurepassword@<db_endpoint>:5432/family_chore_db" },
        { "name": "JWT_SECRET", "value": "a-very-secret-key" }
      ]
    }
  ],
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512"
}
```

### 5.4. Creating the ECS Service

Create an ECS service for each task definition. The service will ensure that the specified number of tasks are running and will handle automatic scaling and load balancing.

## 6. API Gateway Setup

1.  Create a new REST API in Amazon API Gateway.
2.  For each endpoint defined in the `api_specifications.md` document, create a corresponding resource and method.
3.  Configure the integration for each method to be a `VPC Link` to the Network Load Balancer that is fronting your ECS services.
4.  Enable CORS (Cross-Origin Resource Sharing) for all endpoints.
5.  Secure the API using a JWT authorizer (a Lambda function that validates the token).

## 7. CI/CD Pipeline

Use AWS CodePipeline to automate the deployment process.

1.  **Source Stage:** Connect to a GitHub or CodeCommit repository.
2.  **Build Stage:** Use AWS CodeBuild to:
    *   Install dependencies (`npm install`).
    *   Run tests (`npm test`).
    *   Build the Docker image.
    *   Push the image to ECR.
3.  **Deploy Stage:** Use AWS CodeDeploy to update the ECS service with the new Docker image.

## 8. Environment Variables

Store all sensitive information, such as database credentials and API keys, in a secure and centralized location like AWS Secrets Manager. The ECS task definitions can then be configured to pull these secrets at runtime.

**Required Environment Variables:**

*   `DATABASE_URL`: The connection string for the PostgreSQL database.
*   `JWT_SECRET`: The secret key for signing JWTs.
*   `AWS_REGION`: The AWS region where the services are deployed.
*   `S3_BUCKET_NAME`: The name of the S3 bucket for static assets.
*   `OPENAI_API_KEY` / `GEMINI_API_KEY`: API keys for the AI services.

This guide provides a comprehensive roadmap for deploying the family chore management app on AWS. By leveraging managed services and Infrastructure as Code, you can create a robust, scalable, and maintainable system.
