const fieldTypeAliases = {
    multiselect: 'multiSelect',
    multicombobox: 'multiCombobox',
    colorPicker: 'color',
    maskedInput: 'masked',
};
export function normalizeFieldType(type) {
    if (!type) {
        return 'text';
    }
    const alias = fieldTypeAliases[type];
    if (alias) {
        return alias;
    }
    if (type === 'multiselect' || type === 'multicombobox' || type === 'colorPicker' || type === 'maskedInput') {
        return 'text';
    }
    return type;
}
export function normalizeFieldConfig(field) {
    return {
        ...field,
        type: normalizeFieldType(field.type),
        disabled: field.disabled ?? false,
        required: field.required ?? false,
    };
}
