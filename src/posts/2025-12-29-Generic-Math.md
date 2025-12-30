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

```csharp
public static double Add(double x, double y)
{
    return x + y;
}
```

And if we want to calculate the average of a list of integers, we would need to write a different method for each type.
```csharp
public static int Add(int x, int y) // int overload
{
    return x + y;
}

public static int Add(float x, float y) // float overload
{
    return x + y;
}
```

With similar kinds of overloads for other mathematical operations. This can quickly become unwieldy. 

But wait Casper, can't we use generics for this?
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
with a cast to type `T` and using `dynamic` to perform the addition at runtime.
This would indeed work:
```
var resultInt = AdditionsGenericOldSchool.Add(1, 2); // 3
var resultDouble = AdditionsGenericOldSchool.Add(1.0, 2.0); // 3.0
```
however, the method would not be restricted to numbers.
```csharp
// Caveat
var battleTestAddition = AdditionsGenericOldSchool.Add(
    new List<int>() { 1, 2 }, 
    new List<int>() { 3, 4 }
    );
Console.WriteLine($"List addition: {battleTestAddition}"); // No operator+ defined for List<T>, but allowed by method
```
Even worse, the Add method allow us to add nonsensical things like strings or Person objects...
```csharp
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
so typically you'd want to stay in control and write overloaded functions for the types you want to support. 
Generic Math made life easier introducing interfaces that define mathematical operations for types.


## Mathematical interfaces
With Generic Math, we can write a single method that can be used for any type that implements the `IAdditiveIdentity<T>` interface.

One of the biggest differences between Generic Math and previous approaches is that numeric behavior is decomposed into small, focused interfaces. Instead of a single “number” constraint, you can opt into exactly the capabilities your algorithm needs.

For example, if all you need is addition, you don’t need to depend on the full numeric surface area.

### Operator-specific interfaces
```csharp
public static T Add<T>(T x, T y) where T : IAdditionOperators<T, T, T>
{
    return x + y;
}
```

This constraint states precisely what the method requires:

* The + operator
* Two operands of type T (`TLeft` and `TRight`)
* A result of type T (`TResult`)

This would be the most minimal and expressive constraint for an addition-only algorithm. In a more realistic scenario, we want more numb

### Broad numeric interfaces
```csharp
public static T AddNew<T>(T x, T y) where T : INumberBase<T>
{
    return x + y;
}
```

`INumberBase<T>` is a foundational interface implemented by all numeric types. It includes:

* additive and multiplicative identities (Zero, One)
* comparison support
* sign information
* basic numeric guarantees

Using it communicates that the method is intended for general numeric types, even if the implementation only uses `operator+`.

Before Generic Math, generic code had to choose between:
* code duplication
* `dynamic`
* runtime conversions

Now, constraints are part of the type system, enabling compile-time checking.

## Static virtual interface members
Generic Math is built on a feature that did not exist in C# before: static virtual members in interfaces.

Before, interfaces could only describe instance behavior. Static members belonged to the type itself and were not polymorphic. This made it impossible for generic code to express requirements like “this type must provide a + operator” or “this type must expose a numeric zero”.

C# 11 changes this by allowing interfaces to declare static abstract members (often described as **static virtual interface members**).

Before C# 11, interfaces could only describe instance behavior. Static members—such as operators or numeric constants—could not be required by an interface. This made it impossible for generic code to express constraints like “this type must support +” or “this type must provide a zero value”.

C# 11 removes this limitation by allowing interfaces to declare static abstract members, which must be implemented by the type itself.

```csharp
public interface IAdditiveIdentity<TSelf, TResult>
{
    static abstract TResult AdditiveIdentity { get; }
}
```

Any implementing type is now required to supply that static member, enforced at compile time.

Diving into `INumber` and `INumberBase`, we can see that they both declare static members that must be implemented by the type itself.
```csharp
public interface INumber<TSelf>
        : IComparable,
          IComparable<TSelf>,
          IComparisonOperators<TSelf, TSelf, bool>,
          IModulusOperators<TSelf, TSelf, TSelf>,
          INumberBase<TSelf>
        where TSelf : INumber<TSelf>?
 
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

## Conclusion
Generic Math is a great addition to the .NET ecosystem, and it will make it easier to write more flexible and reusable code.