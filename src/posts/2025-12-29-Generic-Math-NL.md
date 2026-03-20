---
layout: post
title: "Generic Math in .NET (NL)"
date: "2025-06-27 20:45:00 +0100"
tags:
  - .NET
  - Libraries
image: generic-math.png
---

## De noodzaak van een .NET Generic Math Library

Microsoft heeft het .NET-ecosysteem continu verbeterd, en een belangrijke toevoeging in recente jaren is de introductie van **Generic Math** sinds C# 11.

Deze feature stelt ontwikkelaars in staat om flexibelere en herbruikbare code te schrijven door wiskundige bewerkingen op generieke types mogelijk te maken.

Laten we eerst kijken naar de problemen vóór Generic Math. Om optellingen voor verschillende types mogelijk te maken, schreef je vaak type-specifieke methodes:

```csharp
public static double Add(double x, double y) => x + y;
public static int Add(int x, int y) => x + y;
public static float Add(float x, float y) => x + y;
```

Dit leidt tot veel dubbele code. Je zou dit kunnen proberen op te lossen met een generieke methode met `dynamic`:
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
Hoewel dit werkt, mist het compile-time veiligheid:
```csharp
// This compiles, but is nonsensical
var wrong = AdditionsGenericOldSchool.Add(
    new List<int> {1, 2}, 
    new List<int> {3, 4}
);
```
Je kunt ook per ongeluk objecten optellen die daar niet voor bedoeld zijn:
```
AdditionsGenericOldSchool.Add(
    new Person { Name = "Amy", Age = 20 },
    new Person { Name = "Bob", Age = 29 }
);
```

## Wiskundige interfaces
Generic Math verdeelt numerieke mogelijkheden in **kleine, gerichte interfaces**. Hierdoor kun je generieke methodes precies beperken tot de benodigde operaties.

Als je bijvoorbeeld alleen optelling nodig hebt:
```csharp
public static T Add<T>(T x, T y) where T : IAdditionOperators<T, T, T>
{
    return x + y;
}
```
Deze constraint beschrijft exact wat nodig is:
* De + operator
* Twee operanden van type T (`TSelf` and `TOther`)
* Een resultaat van type T (`TResult`)

Voor meer algemene numerieke methodes kun je bredere interfaces gebruiken:
```csharp
public static T AddNew<T>(T x, T y) where T : INumberBase<T>
{
    return x + y;
}
```
`INumberBase<T>` is een basisinterface die door alle numerieke types wordt geïmplementeerd en bevat:

* Additieve en multiplicatieve identiteiten (Zero, One)
* Vergelijkingsmogelijkheden
* Informatie over het teken
* Basis numerieke garanties

Je generieke code is nu:
* compile-time veilig
* herbruikbaar
* expressief

## Static virtual interface members
Generic Math is gebouwd op een feature die vóór C# 11 niet bestond:
**static virtual members in interfaces**.

Voorheen konden interfaces alleen gedrag van instanties beschrijven. Statische members waren niet polymorf, waardoor je niet kon afdwingen dat een type bijvoorbeeld een + operator of een numerieke nul implementeert.

C# 11 maakt **static abstract members** in interfaces mogelijk, afgedwongen tijdens compile-time:
```csharp
public interface IAdditiveIdentity<TSelf, TResult>
{
    static abstract TResult AdditiveIdentity { get; }
}
```

Wanneer je deze interface implementeert, móét je deze statische member definiëren — en dat wordt gecontroleerd tijdens compilatie.

Als we kijken naar `INumber` en `INumberBase`, zien we dat ze statische members declareren die door het type zelf geïmplementeerd moeten worden:
```csharp
public interface INumber<TSelf>
        : IComparable,
          IComparable<TSelf>,
          IComparisonOperators<TSelf, TSelf, bool>,
          IModulusOperators<TSelf, TSelf, TSelf>,
          INumberBase<TSelf>
        where TSelf : INumber<TSelf>
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
        where TSelf : INumberBase<TSelf>
```

## Generic Math in de praktijk
Met static virtual interface members kun je generieke code schrijven die werkt voor alle numerieke types:
```csharp
public static T Add<T>(T left, T right) where T : INumber<T>
{
    return left + right;
}

// Gebruik:
int sumInt = Add(5, 10);
double sumDouble = Add(3.5, 2.5);
```
Je kunt ook eenvoudig een gemiddelde berekenen:
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
// Gebruik:
double avg = Average(new double[] { 1.0, 2.0, 3.0 }); // 2.0
int avgInt = Average(new int[] { 1, 2, 3 });          // 2
```
Je kunt zelfs je eigen numerieke types maken en gebruiken. Bijvoorbeeld een eenvoudige `Fraction`:
```csharp
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

    public int CompareTo(Fraction other) => (Numerator * other.Denominator).CompareTo(other.Numerator * Denominator);
    public bool Equals(Fraction other) => Numerator * other.Denominator == other.Numerator * Denominator;

    public override string ToString() => $"{Numerator}/{Denominator}";
}
```
Gebruik:
```sharp
var fractions = new Fraction[]
{
    new Fraction(1, 2),
    new Fraction(3, 4),
    new Fraction(5, 6)
};

Fraction avgFraction = Average(fractions);
Console.WriteLine(avgFraction); // e.g., 11/18
```
Dit laat zien dat Generic Math ook werkt met eigen datatypes.

## Conclusie
Vóór Generic Math moest generieke code kiezen tussen:
* code duplicatie
* `dynamic`
* runtime conversies

Generic Math is een **game changer for .NET**. Het biedt:
* Herbruikbare numerieke algoritmes
* Compile-time veiligheid
* Ondersteuning voor custom numerieke types

Constraints zijn nu onderdeel van het typesysteem, waardoor je tijdens compile-time controle hebt en precies kunt bepalen welke wiskundige operaties beschikbaar moeten zijn.