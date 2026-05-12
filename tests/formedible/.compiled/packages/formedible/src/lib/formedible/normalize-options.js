import { normalizeFieldConfig } from './normalize-field-config.js';
export function normalizeOptions(options) {
    return {
        ...options,
        fields: options.fields.map((field) => normalizeFieldConfig(field)),
    };
}
