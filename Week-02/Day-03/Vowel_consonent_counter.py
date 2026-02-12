def counter(str):
    vowels = 0
    consonants = 0
    for letter in str:
        if letter.isalpha():
            if letter.lower() in 'aeiou':  
                vowels += 1
            else:  
                consonants += 1
    return vowels, consonants

input_str=str(input("Enter a sentence: "))
vowels, consonents = counter(input_str)
print(f"Number of vowels and consonents are {vowels} and {consonents} respectively.")