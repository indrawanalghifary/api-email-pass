#!/bin/bash

# Base URL for the API
BASE_URL="http://localhost:8000"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your_admin_password_here" # Ganti dengan ADMIN_PASSWORD dari .env Anda

echo "Starting API tests with curl..."
echo "---------------------------------"

# Test 1: Accessing the root endpoint (frontend)
echo "Test 1: Accessing root endpoint (frontend)"
curl -s $BASE_URL/
echo -e "\n"

# Test 2: Generate a token (requires admin authentication)
echo "Test 2: Generating a token (admin required)"
GENERATE_TOKEN_RESPONSE=$(curl -s -X POST \
  -u "$ADMIN_USERNAME:$ADMIN_PASSWORD" \
  "$BASE_URL/token/generate/")
echo "$GENERATE_TOKEN_RESPONSE"
GENERATED_TOKEN=$(echo "$GENERATE_TOKEN_RESPONSE" | grep -oP '"token":\s*"\K[^"]+')
echo "Generated Token: $GENERATED_TOKEN"
echo -e "\n"

# Test 3: Check the generated token
echo "Test 3: Checking the generated token"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$GENERATED_TOKEN\"}" \
  "$BASE_URL/token/check/"
echo -e "\n"

# Test 4: Attempt to check an invalid token
echo "Test 4: Attempting to check an invalid token"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"token": "invalid_token_123"}' \
  "$BASE_URL/token/check/"
echo -e "\n"

# Test 5: Get all tokens (requires admin authentication)
echo "Test 5: Getting all tokens (admin required)"
curl -s -u "$ADMIN_USERNAME:$ADMIN_PASSWORD" "$BASE_URL/tokens/"
echo -e "\n"

# Test 6: Update token status (requires admin authentication)
# First, get an existing token ID
TOKEN_ID=$(echo "$GENERATE_TOKEN_RESPONSE" | grep -oP '"id":\s*\K\d+')
echo "Updating status for Token ID: $TOKEN_ID"
curl -s -X PUT \
  -u "$ADMIN_USERNAME:$ADMIN_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false, "token": "dummy"}' \
  "$BASE_URL/tokens/$TOKEN_ID/"
echo -e "\n"

# Test 7: Check the token after deactivation
echo "Test 7: Checking the token after deactivation"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$GENERATED_TOKEN\"}" \
  "$BASE_URL/token/check/"
echo -e "\n"

# Test 8: Delete a token (requires admin authentication)
echo "Test 8: Deleting Token ID: $TOKEN_ID (admin required)"
curl -s -X DELETE \
  -u "$ADMIN_USERNAME:$ADMIN_PASSWORD" \
  "$BASE_URL/tokens/$TOKEN_ID/"
echo -e "\n"

# Test 9: Verify token deletion
echo "Test 9: Verifying token deletion (should return 404 if deleted)"
curl -s -u "$ADMIN_USERNAME:$ADMIN_PASSWORD" "$BASE_URL/tokens/$TOKEN_ID/"
echo -e "\n"

echo "---------------------------------"
echo "API tests finished."