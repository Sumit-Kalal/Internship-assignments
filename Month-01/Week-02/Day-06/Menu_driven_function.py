# program to demonstrate menu-driven functions
while True:
    print("1.Trick question 2. Another trick question 3. Exit")
    choice = int(input("Enter choice: "))

    if choice == 1:
        print("If a lilypad can double in size every day, and it takes 48 days to cover the entire pond, how long would it take to cover half the pond?\n"
        "Answer: 47 days")
    elif choice == 2:
        print("A farmer has 17 sheep, and all but 9 die. How many are left alive?\n"
        "Answer: 9")
    elif choice == 3:
        break
    else:
        print("Invalid option")