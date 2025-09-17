let model;
let knowledgeBase = [];

// База знаний: вопросы и ответы
const qaPairs = [
    { question: "Привет", answer: "Привет! Как дела?" },
    { question: "Как дела?", answer: "У меня всё отлично! Работаю в браузере :) А у тебя?" },
    { question: "Что ты умеешь?", answer: "Я пока только учусь. Могу отвечать на простые вопросы." },
    { question: "Как тебя зовут?", answer: "Меня зовут AI Чат Alpha 0.2!" },
    { question: "Создатель", answer: "Меня создал крутой разработчик на TensorFlow.js!" },
    { question: "Что такое искусственный интеллект?", answer: "ИИ — это область компьютерных наук, которая занимается созданием машин, способных выполнять задачи, требующие человеческого интеллекта." },
    { question: "Пока", answer: "Пока! Было приятно пообщаться!" }
];

// Загрузка модели и инициализация
async function initializeChat() {
    const statusElement = document.getElementById('status');
    statusElement.textContent = 'Загрузка модели...';

    try {
        // Загружаем модель для кодирования предложений
        model = await use.load();
        statusElement.textContent = 'Модель загружена!';

        // Подготавливаем базу знаний: кодируем все вопросы
        knowledgeBase = await encodeQuestions();
    } catch (error) {
        console.error('Ошибка загрузки модели:', error);
        statusElement.textContent = 'Ошибка загрузки модели.';
    }
}

// Кодируем все вопросы из базы знаний
async function encodeQuestions() {
    const questions = qaPairs.map(qa => qa.question);
    const embeddings = await model.embed(questions);
    return qaPairs.map((qa, index) => {
        return {
            question: qa.question,
            answer: qa.answer,
            embedding: embeddings.slice([index, 0], [1])
        };
    });
}

// Поиск наиболее похожего вопроса
async findMostSimilar(userEmbedding) {
    let maxSimilarity = -1;
    let bestAnswer = "Извини, я не понял вопрос. Попробуй перефразировать!";

    for (const item of knowledgeBase) {
        const similarity = await computeCosineSimilarity(userEmbedding, item.embedding);
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            bestAnswer = item.answer;
        }
    }

    // Порог сходства (настрой под себя)
    if (maxSimilarity < 0.5) {
        return "Извини, я не понял вопрос. Попробуй перефразировать!";
    }

    return bestAnswer;
}

// Вычисление косинусного сходства
async function computeCosineSimilarity(embedding1, embedding2) {
    const dotProduct = embedding1.dot(embedding2.transpose()).dataSync()[0];
    const norm1 = embedding1.norm().dataSync()[0];
    const norm2 = embedding2.norm().dataSync()[0];
    return dotProduct / (norm1 * norm2);
}

// Отправка сообщения
async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();

    if (!message) return;

    // Добавляем сообщение пользователя в чат
    addMessage(message, 'user');
    userInput.value = '';

    // Если модель не загружена, ждём
    if (!model) {
        addMessage("Модель ещё загружается...", 'bot');
        return;
    }

    try {
        // Кодируем вопрос пользователя
        const userEmbedding = await model.embed([message]);
        // Ищем ответ
        const answer = await findMostSimilar(userEmbedding);
        // Добавляем ответ бота
        addMessage(answer, 'bot');
    } catch (error) {
        console.error('Ошибка:', error);
        addMessage("Произошла ошибка :(", 'bot');
    }
}

// Добавление сообщения в чат
function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);

    const textElement = document.createElement('div');
    textElement.classList.add('message-text');
    textElement.textContent = text;

    messageElement.appendChild(textElement);
    messagesContainer.appendChild(messageElement);

    // Прокрутка вниз
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Обработчики событий
document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Инициализация чата при загрузке
initializeChat();
