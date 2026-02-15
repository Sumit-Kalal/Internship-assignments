# Program to use dictionary for a simple word-meaning application
dic={}
def add_word():
    word=input("Enter a word: ")
    meaning=input("Enter its meaning: ")
    dic[word.lower()]=meaning
    print(f"Word '{word}' added successfully.")

def search_meaning():
    word=input("Enter the word to look for meaning: ")
    print(dic.get(word.lower(), "Not found in dictionary."))

while True:
    print("1. Add Word 2. Search Meaning 3. Exit")
    choice=int(input("Enter choice: "))

    if choice == 1:
        add_word()
    elif choice == 2:
        search_meaning()
    elif choice == 3:
        break
    else:
        print("Invalid option")