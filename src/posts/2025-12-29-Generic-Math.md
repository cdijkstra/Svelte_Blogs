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
Microsoft has been continuously enhancing the .NET ecosystem, and a great addition in recent years was the introduction of Generic Math since C# 11.

This feature allows developers to write more flexible and reusable code by enabling mathematical operations on generic types.

Let me introduce the kinds of issues we ran into before Generic Math. To allow the addition of allowed type, you would write type-specific methods:

```csharp
public static double Add(double x, double y) => x + y;
public static int Add(int x, int y) => x + y;
public static float Add(float x, float y) => x + y;
```
which introduces a lot of similar methods. We could attempt to solve that by defining a generic method using `dynamic`:
```csharp
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
While this works, it lacks compile-time safety:
```csharp
// This compiles, but is nonsensical
var wrong = AdditionsGenericOldSchool.Add(
    new List<int> {1, 2}, 
    new List<int> {3, 4}
);
```
You could also accidentally add objects you didn’t intend:
```
AdditionsGenericOldSchool.Add(
    new Person { Name = "Amy", Age = 20 },
    new Person { Name = "Bob", Age = 29 }
);
```

## Mathematical interfaces
Generic Math breaks numeric capabilities into **small, focused interfaces**. This lets you constrain generic methods exactly to the operations they require.

For example, if all you need is addition:
```csharp
public static T Add<T>(T x, T y) where T : IAdditionOperators<T, T, T>
{
    return x + y;
}
```
This constraint states precisely what the method requires:
* The + operator
* Two operands of type T (`TSelf` and `TOther`)
* A result of type T (`TResult`)

For more general numeric methods, you can use broader interfaces:
```csharp
public static T AddNew<T>(T x, T y) where T : INumberBase<T>
{
    return x + y;
}
```
`INumberBase<T>` is a foundational interface implemented by all numeric types, and includes:

* Additive and multiplicative identities (`Zero`, `One`)
* Comparison support
* Sign information
* Basic numeric guarantees

Now your generic code is compile-time safe, reusable, and expressive.

## Static virtual interface members
Generic Math is built on a feature that did not exist in C# before: **static virtual members in interface**.
One key feature enabling Generic Math is **static virtual members** in interfaces.

Previously, interfaces could only describe instance behavior. Static members were not polymorphic, so it was impossible to require that a type provide a + operator or expose a numeric zero.

C# 11 allows static abstract members in interfaces, enforced at compile time:
```csharp
public interface IAdditiveIdentity<TSelf, TResult>
{
    static abstract TResult AdditiveIdentity { get; }
}
```

Whenever you inherit from the interface, you have to define that static member, and this is enforced at compile time.

Diving into `INumber` and `INumberBase`, we can see that they both declare static members that must be implemented by the type itself.
```csharp
public interface INumber<TSelf>
        : IComparable,
          IComparable<TSelf>,
          IComparisonOperators<TSelf, TSelf, bool>,
          IModulusOperators<TSelf, TSelf, TSelf>,
          INumberBase<TSelf>
        where TSelf : INumber<TSelf>?
```
```csharp
public interface INumberBase<TSelf>
        : IAdditionOperators<TSelf, TSelf, TSelf>,
          IAdditiveIdentity<TSelf, TSelf>,
          IDecrementOperators<TSelf>,
          IDivisionOperators<TSelf, TSelf, TSelf>,
          IEquatable<TSelf>,
          IEqualityOperators<TSelf, TSelf, bool>,
          IIncrementOperators<TSelf>,
          IMultiplicativeIdentity<TSelf, TSelf>,
          IMultiplyOperators<TSelf, TSelf, TSelf>,
          ISpanFormattable,
          ISpanParsable<TSelf>,
          ISubtractionOperators<TSelf, TSelf, TSelf>,
          IUnaryPlusOperators<TSelf, TSelf>,
          IUnaryNegationOperators<TSelf, TSelf>
        where TSelf : INumberBase<TSelf>?
```

## Using Generic Math in Practice
With static virtual interface members, you can now write generic code that works seamlessly across all numeric types. For example, you can create a method that adds two values of any numeric type:
```csharp
public static T Add<T>(T left, T right) where T : INumber<T>
{
    return left + right;
}
// Usage:
int sumInt = Add(5, 10);
double sumDouble = Add(3.5, 2.5);
```
We can now also leverage Generic Math capabilities to write a function that calculates the average
```csharp
public static T Average<T>(T[] numbers) where T : INumber<T>
{
    if (numbers.Length == 0) return T.Zero;
    T sum = T.Zero;
    foreach (var n in numbers)
    {
        sum += n;
    }
    return sum / T.CreateChecked(numbers.Length);
}
// Usage:
double avg = Average(new double[] { 1.0, 2.0, 3.0 }); // 2.0
int avgInt = Average(new int[] { 1, 2, 3 });          // 2
```
You can define your own numeric types and plug them into generic methods. Example: a simple `Fraction` type.
```
public readonly struct Fraction : INumber<Fraction>
{
    public long Numerator { get; }
    public long Denominator { get; }

    public Fraction(long numerator, long denominator)
    {
        if (denominator == 0) throw new DivideByZeroException();
        Numerator = numerator;
        Denominator = denominator;
    }

    // Zero and One
    public static Fraction Zero => new Fraction(0, 1);
    public static Fraction One => new Fraction(1, 1);

    // Operators
    public static Fraction operator +(Fraction a, Fraction b)
        => new Fraction(a.Numerator * b.Denominator + b.Numerator * a.Denominator,
                        a.Denominator * b.Denominator);

    public static Fraction operator /(Fraction a, Fraction b)
        => new Fraction(a.Numerator * b.Denominator, a.Denominator * b.Numerator);

    public static Fraction AdditiveIdentity => Zero;
    public static Fraction MultiplicativeIdentity => One;

    // Minimal required members for demonstration
    public int CompareTo(Fraction other) => (Numerator * other.Denominator).CompareTo(other.Numerator * Denominator);
    public bool Equals(Fraction other) => Numerator * other.Denominator == other.Numerator * Denominator;
    public override string ToString() => $"{Numerator}/{Denominator}";
}
```
This can now be used as
```
var fractions = new Fraction[]
{
    new Fraction(1, 2),
    new Fraction(3, 4),
    new Fraction(5, 6)
};

Fraction avgFraction = Average(fractions);
Console.WriteLine(avgFraction); // e.g., 25/24
```

## Conclusion
Before Generic Math, generic code had to choose between:
* code duplication
* `dynamic`
* runtime conversions

Generic Math is a **game changer for .NET**. It allows:
* Reusable numeric algorithms
* Compile-time safety
* Support for custom numeric types

Now, constraints are part of the type system, enabling compile-time checking!