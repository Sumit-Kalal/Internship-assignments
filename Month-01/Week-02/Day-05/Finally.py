try:
    x = int(input("Enter a number: "))
    print(10 / x)
except Exception as e:
    print("Error:", e)
finally:
    print("Program finished execution")
