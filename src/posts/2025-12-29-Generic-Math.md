---
layout: post
title: "Generic Math in .NET"
date: "2025-06-27 20:45:00 +0100"
tags:
  - .NET
  - Libraries
image: generic-math.png
---

## The need for a .NET Generic Math Library
Microsoft has been continuously enhancing the .NET ecosystem, and a great addition in recent years was the introduction of Generic Math in .NET 7. 

This feature allows developers to write more flexible and reusable code by enabling mathematical operations on generic types.

I will introduce the concept by first demoing what kind of repeated code you could get *before* Generic Math was introduced.

```
public static double Add(double x, double y) // Overload
{
    return x + y;
}
```

And if we want to calculate the average of a list of integers, we would need to write a different method for each type.
```
public static int Add(int x, int y)
{
    return x + y;
}
```

With similar kinds of overloads for other mathematical operations. This can quickly become unwieldy. 

But wait Casper, can't we use generics for this?
```
public static class AdditionsGenericOldSchool
{
    public static T Add<T>(T x, T y)
    {
        dynamic num1 = x;
        dynamic num2 = y;
        return (T)num1 + num2;
    }
}
```
This would indeed work
```
// Part 2 Generic Math Workaround, before C# 11
var resultInt = AdditionsGenericOldSchool.Add(1, 2); // 3
var resultDouble = AdditionsGenericOldSchool.Add(1.0, 2.0); // 3.0
```
however, the method would not be restricted to numbers.
```
// Caveat
var battleTestAddition = AdditionsGenericOldSchool.Add(
    new List<int>() { 1, 2 }, 
    new List<int>() { 3, 4 }
    );
Console.WriteLine($"List addition: {battleTestAddition}"); // No operator+ defined for List<T>, but allowed by method
```
And the method would even allow us to add nonsensical things like strings or Person objects...
```
AdditionsGenericOldSchool.Add(
new Person()
{
    Name = "Amy", Age = 20
}, 
new Person()
{
    Name = "Bob", Age = 29
});
```
Generic Math solves this problem by introducing interfaces that define mathematical operations for types.


## Mathematical interfaces
With Generic Math, we can write a single method that can be used for any type that implements the `IAdditiveIdentity<T>` interface.

```
public static T Add<T>(T x, T y) where T : INumberBase<T>
{
    return x + y;
}
```
Or
```
public static T Add2<T>(T x, T y) where T : IAdditionOperators<T, T, T>
{
    return x + y;
}
```

## Static virtual interface members