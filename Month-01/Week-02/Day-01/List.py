#creating a list of random numbers
Ran_num=[84,25,15,14,75,35,26,86,95,44,55,78,23,18]

#printing the list
print("List of Random Numbers:", Ran_num)

#finding the largest of the numbers
print("Largest of the list:",max(Ran_num))

#finding the smallest of the numbers
print("Smallest of the list: ",min(Ran_num))

#sorting in ascending order
Ran_num.sort()
print("Sorted List in Ascending Order:", Ran_num)

#sorting in descending order
Ran_num.sort(reverse=True)
print("Sorted List in Descending Order:", Ran_num)

#creating a tuple from the list
tuple=tuple(Ran_num)
print("Tuple from the List:", tuple)

