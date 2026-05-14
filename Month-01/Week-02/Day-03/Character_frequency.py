def ch_freq(str):
    freq={}
    for letter in str:
        if letter in freq:
            freq[letter] += 1
        else:
            freq[letter] = 1
        
    print(freq)

input_str=str(input("Enter a sentence: "))
ch_freq(input_str)
