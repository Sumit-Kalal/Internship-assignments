text=str(input("Enter a sentence: "))
words = text.split()
freq = {}

for i in words:
    freq[i] = freq.get(i, 0) + 1

print(freq)
