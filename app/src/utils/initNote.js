function addInitNote() {
    notesService.addNote({
        endTime: false,
        finished: 0,
        notificate: false,
        pictureSourceModal: false,
        startTime: false,
        tag: "#c5282f",
        title: "Привет",
        added: moment().startOf("day"),
        dynamicFields: [
            {
                type: "text",
                value: "Это - пример того, как выглядит заметка в Ежедневнике. Нажмите на заметку что-бы увидеть полное содержание.\nЗаметка может содержать в себе:"
            },
            {
                type: "listItem",
                value: "Обычный теск",
                checked: true
            },
            {
                type: "listItem",
                value: "Списки",
                checked: true
            },
            {
                type: "listItem",
                value: "Цветовую метку",
                checked: true
            },
            {
                type: "listItem",
                value: "Фото",
                checked: true
            },
            {
                type: "listItem",
                value: "Напоминание",
                checked: true
            },
            {
                type: "text",
                value: "Можно настроить автоматическое повторение заметок."
            },
            {
                type: "text",
                value: "Приятного пользования!"
            }
        ]            
    })
}