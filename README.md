# Identity Management in Cloud

The project explains how a Federated Identity Mangement System works. It explores the integration of various authentication and access management technologies, including Google OAuth, AWS Cognito, and OpenLDAP.

## Introduction

This project elaborates on the process of web identity federation and access management in a distributed web application environment. The application leverages Google OAuth for authentication, AWS Cognito for identity management, and LDAP for role-based access control.

## Amazon Cognito

Amazon Cognito is a managed authentication, authorization, and user management service provided by Amazon Web Services (AWS). It consists of:

- User Pools
- Identity Pools (Federated Identities)

## OpenLDAP

OpenLDAP is an open-source LDAP (Lightweight Directory Access Protocol) implementation for directory services. Key features include hierarchical organization for efficient searching.

## Process Steps

1. **User initiates the authentication process**: The process begins when the user navigates to the authentication section of the website and selects the Google OAuth option.

2. **Google OAuth authentication**: The user's credentials are authenticated using Google OAuth. Upon successful authentication, Google issues an authentication token to the user.

3. **Exchange for temporary AWS credentials**: The authentication token obtained from Google is exchanged for temporary Amazon AWS credentials through the Cognito API. These credentials are used to access AWS services securely.

4. **Verification of organization association**: The application verifies whether the user is associated with the "IIITG" organization. This step ensures that only authorized users from the designated organization can proceed further.

5. **Grant access for non-"IIITG" users**: If the user does not belong to the "IIITG" organization, they are granted access to only two images on the website.

6. **Role examination for "IIITG" users**: For users affiliated with the "IIITG" organization, the application further examines their role using an LDAP server hosted on an EC2 instance.

   a. If the user is identified as an administrator, they are permitted to view four images on the website.
   
   b. If the user is identified as a student, they are allowed to view three images on the website.


## Observations

Cognito Identity Pools, while offering temporary AWS credentials for authenticated users, exhibit a caching behavior that limits the storage of authentication tokens to a small number, often around two entries, per user or identity. This can result in authentication failures for new users during their initial login attempts due to cache misses. Subsequent login attempts by the same user may succeed as the necessary information is retrieved from the cache. 
