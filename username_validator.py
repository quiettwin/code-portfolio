#!/usr/bin/env python3

import re

def validate_user(username, minlen):
    """
    Validates a username based on security best practices.
    
    Args:
        username (str): The username to validate
        minlen (int): The minimum length required for the username
        
    Returns:
        bool: True if the username meets all criteria, False otherwise
        
    Raises:
        TypeError: If username is not a string
        ValueError: If minlen is less than 1
        
    Validation rules:
        - Username must be at least minlen characters long
        - Username can only contain lowercase letters, numbers, dots and underscores
        - Username cannot begin with a number
    """
    # Validation for function parameters
    if type(username) != str:
        raise TypeError("username must be a string")
    if minlen < 1:
        raise ValueError("minlen must be at least 1")
    
    # Validation for username length
    if len(username) < minlen:
        return False
        
    # Validation for allowed characters (lowercase letters, numbers, dots and underscores)
    if not re.match('^[a-z0-9._]*$', username):
        return False
        
    # Validation to ensure username doesn't begin with a number
    if username[0].isnumeric():
        return False
        
    # If all validation checks pass
    return True

# Example usage:
if __name__ == "__main__":
    # Valid usernames
    print(validate_user("blue.23", 5))  # True
    print(validate_user("john_doe", 5))  # True
    
    # Invalid usernames
    print(validate_user("2blue", 5))  # False - starts with a number
    print(validate_user("ab", 5))  # False - too short
    print(validate_user("User@123", 5))  # False - contains uppercase and special chars