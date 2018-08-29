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
                value:"Это - пример того, как выглядит типичная заметка в Ежедневнике.  Нажмите на заметку что-бы увидеть полное содержание.\nЗаметка может содержать в себе:"
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
                value: "Ежедневник постоянно развивается. В наши ближайшие планы входит:"
            },
            {
                type: "listItem",
                value: "Резервное копирование и синхронизация между устройствами",
                checked: false
            },
            {
                type: "listItem",
                value: "Улучшение производительности",
                checked: false
            },
            {
                type: "text",
                value: "Приятного пользования!"
            }
        ]            
    })
}