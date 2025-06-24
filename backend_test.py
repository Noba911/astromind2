import requests
import json
import datetime
from datetime import date
import time
import unittest
import os
import logging

# Set testing mode environment variable to true to use mock responses
os.environ['TESTING_MODE'] = 'true'

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get backend URL from frontend .env file
BACKEND_URL = "https://c03276b9-d4f5-4056-a0cf-4910d784eb7c.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

class AstrologyBackendTests(unittest.TestCase):
    """Test suite for the Astrology AI Backend API endpoints"""
    
    def setUp(self):
        """Set up test data and variables"""
        # Generate unique email for each test run to avoid conflicts
        timestamp = int(time.time())
        self.test_user = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "SecurePassword123!",
            "name": "Test User",
            "birth_date": "1990-05-15",
            "birth_time": "14:30",
            "birth_place": "New York, USA"
        }
        self.auth_token = None
        self.user_id = None
    
    def test_01_user_registration(self):
        """Test user registration endpoint"""
        logger.info("Testing user registration...")
        
        url = f"{API_URL}/auth/register"
        response = requests.post(url, json=self.test_user)
        
        self.assertEqual(response.status_code, 200, f"Registration failed: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("access_token", data, "Access token missing in response")
        self.assertIn("user", data, "User data missing in response")
        self.assertIn("id", data["user"], "User ID missing in response")
        self.assertIn("zodiac_sign", data["user"], "Zodiac sign missing in response")
        
        # Store token for subsequent tests
        self.auth_token = data["access_token"]
        self.user_id = data["user"]["id"]
        
        logger.info(f"User registered successfully with ID: {self.user_id}")
        logger.info(f"Zodiac sign calculated as: {data['user']['zodiac_sign']}")
    
    def test_02_user_login(self):
        """Test user login endpoint"""
        logger.info("Testing user login...")
        
        # First ensure we have a registered user
        if not self.user_id:
            try:
                self.test_01_user_registration()
            except AssertionError as e:
                if "Email already registered" in str(e):
                    # User already exists, which is fine for login test
                    pass
                else:
                    raise
        
        url = f"{API_URL}/auth/login"
        login_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"]
        }
        
        response = requests.post(url, json=login_data)
        
        self.assertEqual(response.status_code, 200, f"Login failed: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("access_token", data, "Access token missing in response")
        self.assertIn("user", data, "User data missing in response")
        self.assertEqual(data["user"]["email"], self.test_user["email"], "Email mismatch in response")
        
        # Update token for subsequent tests
        self.auth_token = data["access_token"]
        logger.info("User login successful")
    
    def test_03_get_user_profile(self):
        """Test getting user profile with authentication"""
        logger.info("Testing user profile retrieval...")
        
        # Ensure we have a token
        if not self.auth_token:
            try:
                self.test_01_user_registration()
            except AssertionError as e:
                if "Email already registered" in str(e):
                    # Try login instead
                    self.test_02_user_login()
                else:
                    raise
        
        url = f"{API_URL}/profile"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        response = requests.get(url, headers=headers)
        
        self.assertEqual(response.status_code, 200, f"Profile retrieval failed: {response.text}")
        data = response.json()
        
        # Verify profile data
        self.assertEqual(data["email"], self.test_user["email"], "Email mismatch in profile")
        self.assertEqual(data["name"], self.test_user["name"], "Name mismatch in profile")
        self.assertEqual(data["birth_place"], self.test_user["birth_place"], "Birth place mismatch in profile")
        
        logger.info("User profile retrieved successfully")
    
    def test_04_daily_horoscope_generation(self):
        """Test daily horoscope generation with different tones using mock responses"""
        logger.info("Testing daily horoscope generation with mock responses...")
        
        # Ensure we have a token
        if not self.auth_token:
            try:
                self.test_01_user_registration()
            except AssertionError as e:
                if "Email already registered" in str(e):
                    # Try login instead
                    self.test_02_user_login()
                else:
                    raise
        
        url = f"{API_URL}/horoscope/daily"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test with different tones
        tones = ["serious", "humorous", "soul"]
        
        for tone in tones:
            logger.info(f"Testing horoscope with tone: {tone}")
            payload = {"tone": tone}
            
            response = requests.post(url, json=payload, headers=headers)
            
            self.assertEqual(response.status_code, 200, 
                            f"Horoscope generation failed for tone '{tone}': {response.text}")
            
            data = response.json()
            
            # Verify response structure
            self.assertIn("content", data, "Content missing in horoscope response")
            self.assertIn("tone", data, "Tone missing in horoscope response")
            self.assertEqual(data["tone"], tone, f"Tone mismatch in response for '{tone}'")
            self.assertTrue(len(data["content"]) > 50, "Horoscope content too short")
            
            # Verify this is the mock response
            mock_content = "Your daily horoscope suggests that today is an excellent day for new beginnings"
            self.assertIn(mock_content, data["content"], 
                           f"Response does not match expected mock response for tone '{tone}'")
            
            logger.info(f"Horoscope generated successfully with tone: {tone}")
            logger.info(f"Sample content: {data['content'][:100]}...")
    
    def test_05_compatibility_analysis(self):
        """Test compatibility analysis with partner birth data using real Azure OpenAI"""
        logger.info("Testing compatibility analysis with real Azure OpenAI...")
        
        # Ensure we have a token
        if not self.auth_token:
            try:
                self.test_01_user_registration()
            except AssertionError as e:
                if "Email already registered" in str(e):
                    # Try login instead
                    self.test_02_user_login()
                else:
                    raise
        
        url = f"{API_URL}/compatibility/analyze"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Partner data
        partner_data = {
            "partner_birth_date": "1992-08-22",
            "partner_birth_time": "18:45",
            "partner_birth_place": "Los Angeles, USA",
            "tone": "serious"
        }
        
        response = requests.post(url, json=partner_data, headers=headers)
        
        self.assertEqual(response.status_code, 200, 
                        f"Compatibility analysis failed: {response.text}")
        
        data = response.json()
        
        # Verify response structure
        self.assertIn("content", data, "Content missing in compatibility response")
        self.assertIn("tone", data, "Tone missing in compatibility response")
        self.assertTrue(len(data["content"]) > 100, "Compatibility content too short")
        
        # Verify this is not the mock response by checking for unique content
        mock_content = "Compatibility Analysis: 78% Match"
        self.assertNotIn(mock_content, data["content"], "Response appears to be the mock response")
        
        logger.info("Compatibility analysis generated successfully")
        logger.info(f"Sample content: {data['content'][:100]}...")
    
    def test_06_friend_communication_advice(self):
        """Test friend communication advice with multiple friend names using real Azure OpenAI"""
        logger.info("Testing friend communication advice with real Azure OpenAI...")
        
        # Ensure we have a token
        if not self.auth_token:
            try:
                self.test_01_user_registration()
            except AssertionError as e:
                if "Email already registered" in str(e):
                    # Try login instead
                    self.test_02_user_login()
                else:
                    raise
        
        url = f"{API_URL}/friends/advice"
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Friend names
        friend_data = {
            "friend_names": ["Alex", "Jordan", "Taylor"],
            "tone": "humorous"
        }
        
        response = requests.post(url, json=friend_data, headers=headers)
        
        self.assertEqual(response.status_code, 200, 
                        f"Friend advice generation failed: {response.text}")
        
        data = response.json()
        
        # Verify response structure
        self.assertIn("content", data, "Content missing in friend advice response")
        self.assertIn("tone", data, "Tone missing in friend advice response")
        self.assertEqual(data["tone"], "humorous", "Tone mismatch in friend advice response")
        self.assertTrue(len(data["content"]) > 100, "Friend advice content too short")
        
        # Verify this is not the mock response by checking for unique content
        mock_content = "When communicating with your friends, remember that your astrological profile suggests"
        self.assertNotIn(mock_content, data["content"], "Response appears to be the mock response")
        
        # Check if all friend names are mentioned in the response
        for friend in friend_data["friend_names"]:
            self.assertIn(friend, data["content"], f"Friend name '{friend}' not found in response")
        
        logger.info("Friend communication advice generated successfully")
        logger.info(f"Sample content: {data['content'][:100]}...")
    
    def test_07_invalid_auth(self):
        """Test endpoints with invalid authentication"""
        logger.info("Testing invalid authentication handling...")
        
        url = f"{API_URL}/profile"
        
        # Test with invalid token
        headers = {"Authorization": "Bearer invalid_token_here"}
        response = requests.get(url, headers=headers)
        
        self.assertNotEqual(response.status_code, 200, 
                          "Request should fail with invalid token")
        self.assertTrue(response.status_code in [401, 403], 
                      f"Expected 401/403 status code, got {response.status_code}")
        
        logger.info("Invalid authentication handled correctly")

if __name__ == "__main__":
    # Run the tests
    logger.info("Starting Astrology Backend API Tests...")
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
    logger.info("All tests completed.")