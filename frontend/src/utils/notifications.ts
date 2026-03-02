export const renderTemplate = (template: string, data: Record<string, any>) => {
    return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
        const value = data[key.trim()]
        return value !== undefined ? value : `{{${key}}}`
    })
}
