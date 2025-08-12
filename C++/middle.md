# Вопросы для middle-senior C++ разработчика с ответами и примерами кода

---

### 1. Что такое "правило трёх/пяти" в C++?

**Ответ:**  
Если класс реализует деструктор, копирующий конструктор или оператор копирующего присваивания, нужно реализовать все три ("правило трёх"). С введением перемещающих конструкторов и операторов присваивания — реализовать 5 методов ("правило пяти").

**Пример:**

```cpp
#include <cstring>

class String {
    char* data;
public:
    String(const char* s = "") {
        data = new char[strlen(s) + 1];
        strcpy(data, s);
    }

    // Копирующий конструктор
    String(const String& other) {
        data = new char[strlen(other.data) + 1];
        strcpy(data, other.data);
    }

    // Оператор копирующего присваивания
    String& operator=(const String& other) {
        if (this != &other) {
            delete[] data;
            data = new char[strlen(other.data) + 1];
            strcpy(data, other.data);
        }
        return *this;
    }

    // Деструктор
    ~String() {
        delete[] data;
    }

    // Перемещающий конструктор
    String(String&& other) noexcept : data(other.data) {
        other.data = nullptr;
    }

    // Перемещающий оператор присваивания
    String& operator=(String&& other) noexcept {
        if (this != &other) {
            delete[] data;
            data = other.data;
            other.data = nullptr;
        }
        return *this;
    }
};
```

---

### 2. Что такое volatile в C++ и когда его стоит применять?

**Ответ:**  
`volatile` предотвращает оптимизации компилятора для переменной, значение которой может меняться вне программы (например, аппаратурой). В многопоточных приложениях чаще применяют `std::atomic`. `volatile` используют в низкоуровневом программировании (работа с памятью, регистрами).

**Пример:**

```cpp
volatile int flag = 0;

void hardwareInterruptHandler() {
    flag = 1; // Значение может измениться из прерывания
}

int main() {
    while (!flag) {
        // Ждём изменения флага, не оптимизируется в цикл с бесконечным кэшированием
    }
    // После изменения флага продолжаем работу
}
```

---

### 3. Что такое "черно-красное дерево" (Red-Black Tree) и зачем оно нужно?

**Ответ:**  
Черно-красное дерево — это сбалансированное бинарное дерево поиска с дополнительным свойством: каждый узел окрашен в красный или чёрный цвет. Оно гарантирует, что путь от корня до листа не будет слишком длинным, обеспечивая операции вставки, удаления и поиска за время O(log n). Используется для эффективного хранения отсортированных данных.

**Пример:**  
В стандартной библиотеке C++ контейнер `std::map` реализован на основе черно-красного дерева, что обеспечивает логарифмическую сложность доступа и модификации.

```cpp
#include <map>
#include <iostream>

int main() {
    std::map<int, std::string> myMap;

    myMap[10] = "десять";
    myMap[5] = "пять";
    myMap[20] = "двадцать";

    for (const auto& [key, value] : myMap) {
        std::cout << key << " => " << value << std::endl;
    }

    // Поиск элемента
    auto it = myMap.find(5);
    if (it != myMap.end()) {
        std::cout << "Найден элемент с ключом 5: " << it->second << std::endl;
    }
}
```

---

### 4. Что такое move-семантика и зачем она нужна в C++11 и новее?

**Ответ:**  
Move-семантика позволяет "перемещать" ресурсы из одного объекта в другой вместо их копирования, что значительно ускоряет работу с временными объектами и большими ресурсами. Это достигается через перемещающий конструктор и перемещающий оператор присваивания.

**Пример:**

```cpp
#include <iostream>
#include <vector>

class Buffer {
    std::vector<int> data;
public:
    Buffer(size_t size) : data(size) {
        std::cout << "Конструктор\n";
    }

    // Перемещающий конструктор
    Buffer(Buffer&& other) noexcept : data(std::move(other.data)) {
        std::cout << "Перемещающий конструктор\n";
    }

    // Оператор копирования
    Buffer(const Buffer& other) : data(other.data) {
        std::cout << "Копирующий конструктор\n";
    }
};

Buffer createBuffer() {
    Buffer buf(1000000);
    return buf;  // Возврат временного объекта
}

int main() {
    Buffer b1 = createBuffer(); // Вызовется перемещающий конструктор, а не копирующий
}
```

---

### 5. Что такое `constexpr` и как использовать его в современных версиях C++?

**Ответ:**  
`constexpr` означает, что функцию или переменную можно вычислить на этапе компиляции. Это позволяет оптимизировать код, выполнять проверки и вычисления заранее, снижая нагрузку во время выполнения.

**Пример:**

```cpp
constexpr int factorial(int n) {
    return n <= 1 ? 1 : (n * factorial(n - 1));
}

int main() {
    constexpr int val = factorial(5);  // Вычисляется на этапе компиляции
    int arr[val];  // размер массива фиксирован компилятором
    return 0;
}
```

---

### 6. Объясните понятие шаблонов (templates) в C++ и приведите пример функции-шаблона.

**Ответ:**  
Шаблоны позволяют писать обобщённый код, который компилируется под разные типы данных. Это ключевой механизм для создания универсальных библиотек.

**Пример:**

```cpp
#include <iostream>

template<typename T>
T max(T a, T b) {
    return (a > b) ? a : b;
}

int main() {
    std::cout << max(10, 20) << "\n";      // int
    std::cout << max(3.5, 2.5) << "\n";    // double
    std::cout << max('a', 'z') << "\n";    // char
}
```
---

### 7. Что такое SFINAE и как его можно использовать?

**Ответ:**  
SFINAE (Substitution Failure Is Not An Error) — механизм в шаблонах C++, который позволяет исключать неподходящие перегрузки функций или специализации шаблонов во время подстановки типов, не вызывая ошибки компиляции.

**Пример:**

```cpp
#include <type_traits>
#include <iostream>

template<typename T>
typename std::enable_if<std::is_integral<T>::value, void>::type
printType() {
    std::cout << "Целочисленный тип\n";
}

template<typename T>
typename std::enable_if<!std::is_integral<T>::value, void>::type
printType() {
    std::cout << "Не целочисленный тип\n";
}

int main() {
    printType<int>();    // Целочисленный тип
    printType<double>(); // Не целочисленный тип
}
```

---

### 8. Как работает `std::optional` и когда его стоит использовать?

**Ответ:**  
`std::optional` — обёртка для значения, которое может быть как валидным, так и отсутствовать (empty). Используется для явного представления необязательных значений без использования указателей.

**Пример:**

```cpp
#include <optional>
#include <iostream>

std::optional<int> findPositive(int x) {
    if (x > 0) return x;
    else return std::nullopt;
}

int main() {
    auto val = findPositive(10);
    if (val) {
        std::cout << "Найдено значение: " << *val << std::endl;
    } else {
        std::cout << "Значение отсутствует\n";
    }
}
```

---

### 9. Что такое noexcept и как это влияет на производительность?

**Ответ:**  
`noexcept` — спецификатор функции в C++, который указывает, что функция не выбрасывает исключений. Это позволяет компилятору выполнять оптимизации вызова таких функций и влияет на поведение стандартных контейнеров и алгоритмов, особенно при перемещении объектов, где операции без исключений предпочтительнее.

**Пример:**

```cpp
#include <iostream>

void foo() noexcept {
    std::cout << "Функция, которая не выбрасывает исключения\n";
}

int main() {
    foo();
}
```
