import React from 'react';

export function useLocalStorageWithExpiry(key, defaultValue, expiryHours = 24) {
    const getValue = () => {
        try {
            const item = localStorage.getItem(key);
            if (!item) {
                const expiry = new Date();
                expiry.setHours(expiry.getHours() + expiryHours);
                const newItem = {
                    value: defaultValue,
                    expiry: expiry.getTime()
                };
                localStorage.setItem(key, JSON.stringify(newItem));
                return defaultValue;
            }

            const parsed = JSON.parse(item);
            const now = new Date();

            if (now.getTime() > parsed.expiry) {
                localStorage.removeItem(key);
                return defaultValue;
            }
            return parsed.value;

        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    };
    const [value, setValue] = React.useState(getValue);

    const setValueWithExpiry = (newValue) => {
        try {
            const expiry = new Date();
            expiry.setHours(expiry.getHours() + expiryHours);

            const item = {
                value: newValue,
                expiry: expiry.getTime()
            };

            localStorage.setItem(key, JSON.stringify(item));
            setValue(newValue);
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    };

    return [value, setValueWithExpiry];
}

export default useLocalStorageWithExpiry;
