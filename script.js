// Определяем модель
let model;

// Данные для обучения XOR
const trainingData = {
    inputs: tf.tensor2d([[0, 0], [0, 1], [1, 0], [1, 1]]),
    labels: tf.tensor2d([[0], [1], [1], [0]])
};

// Выбранные пользователем значения
let userInput = { a: null, b: null };

// Функция выбора ввода
function selectInput(input, value) {
    userInput[input] = value;
    // Визуально выделяем выбранную кнопку
    document.querySelectorAll(`button[id^="${input}-"]`).forEach(btn => {
        btn.classList.remove('selected');
    });
    document.getElementById(`${input}-${value}`).classList.add('selected');
    console.log(`Выбрано: A=${userInput.a}, B=${userInput.b}`);
}

// Функция создания и обучения модели
async function trainModel() {
    const statusElement = document.getElementById('status');
    statusElement.textContent = 'Статус: Создание модели...';

    // Создаем последовательную модель
    model = tf.sequential();

    // Добавляем слои
    model.add(tf.layers.dense({ units: 4, inputShape: [2], activation: 'sigmoid' })); // Скрытый слой
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Выходной слой

    // Компилируем модель
    model.compile({
        optimizer: tf.train.adam(0.1), // Оптимизатор с learning rate
        loss: 'meanSquaredError' // Функция потерь
    });

    statusElement.textContent = 'Статус: Идет обучение... (это займет ~10 секунд)';

    // Обучаем модель
    await model.fit(trainingData.inputs, trainingData.labels, {
        epochs: 250, // Количество эпох
        shuffle: true, // Перемешивать данные каждую эпоху
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                // Можно раскомментировать, чтобы видеть процесс обучения в консоли
                // console.log(`Эпоха ${epoch + 1}/250, Ошибка: ${logs.loss}`);
            }
        }
    });

    statusElement.textContent = 'Статус: Модель обучена! Можешь делать предсказания.';
    alert('Обучение завершено!');
}

// Функция предсказания
function predict() {
    if (!model) {
        alert('Сначала обучи модель!');
        return;
    }
    if (userInput.a === null || userInput.b === null) {
        alert('Выбери значения для A и B!');
        return;
    }

    // Преобразуем пользовательский ввод в тензор
    const inputTensor = tf.tensor2d([[userInput.a, userInput.b]]);

    // Делаем предсказание
    const prediction = model.predict(inputTensor);

    // Получаем значение из тензора и округляем его до 0 или 1
    const result = prediction.dataSync()[0];
    const roundedResult = Math.round(result);

    // Выводим результат
    document.getElementById('result').innerText = 
        `Результат: ${roundedResult} (Уверенность: ${result.toFixed(3)})`;

    // Очищаем память от тензоров
    inputTensor.dispose();
    prediction.dispose();
}
