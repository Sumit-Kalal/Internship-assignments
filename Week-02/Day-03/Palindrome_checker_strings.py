def palindrome_checker(str):
     # converts string into lowercase and removes spaces
    lower_str = str.lower().replace(" ", "")
    if lower_str == lower_str[::-1]:
        print(f"{str} is a palindrome.")
    else:
        print(f"{str} is not a palindrome.")

test_string = input("Enter a string to check for palindrome: ")
palindrome_checker(test_string)
