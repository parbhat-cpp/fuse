export const renderTemplate = (template: string, data: Record<string, any>) => {
    return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
        const value = data[key.trim()]
        return value !== undefined ? value : `{{${key}}}`
    })
}

export const pushNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
        new Notification(title, options)
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, options)
            }
        })
    }
}
