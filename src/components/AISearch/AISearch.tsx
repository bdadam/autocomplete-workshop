import { useEffect, useReducer, Reducer, useState } from 'react';

import pDebounce from 'p-debounce';

import styles from './AISearch.module.css';
const getSuggestions = pDebounce(async (query: string) => {
    const result: { suggestions: string[] } = await fetch(
        `https://www.autoscout24.de/classified-list/ai-search/autocomplete/${encodeURIComponent(query)}?articleType=C`
    ).then((r) => r.json());

    return result.suggestions;
}, 200);

async function getListPageUrl(query: string) {
    const response: { query: string } = await fetch(
        `https://www.autoscout24.de/classified-list/ai-search/search/${encodeURIComponent(
            query
        )}?articleType=C&countryCode=de`
    ).then((r) => r.json());

    return response.query;
}

type State = {
    isSubmitting: boolean;
    requestingAutocomplete: boolean;
    text: string;
    suggestions: string[];
};

type Action =
    | { type: 'autocomplete-start'; query: string }
    | { type: 'autocomplete-end'; suggestions: string[] }
    | { type: 'submit'; value?: string }
    | { type: 'reset' };

const reducer: Reducer<State, Action> = (state, action) => {
    if (action.type === 'autocomplete-start') {
        return { ...state, requestingAutocomplete: true, text: action.query };
    }

    if (action.type === 'submit') {
        return { ...state, isSubmitting: true, text: action.value ?? state.text, suggestions: [] };
    }

    if (action.type === 'autocomplete-end') {
        return { ...state, suggestions: action.suggestions, requestingAutocomplete: false };
    }

    if (action.type === 'reset') {
        return { isSubmitting: false, suggestions: [], text: '', requestingAutocomplete: false };
    }

    return state;
};

const AISearch: React.FC<{}> = () => {
    const [state, dispatch] = useReducer(reducer, {
        text: '',
        suggestions: [],
        isSubmitting: false,
        requestingAutocomplete: false,
    });

    const [navigateTo, setNavigateTo] = useState('');

    useEffect(() => {
        if (state.requestingAutocomplete) {
            const currentText = state.text;

            if (currentText === '') {
                dispatch({ type: 'autocomplete-end', suggestions: [] });
                return;
            }

            (async () => {
                const suggestions = await getSuggestions(currentText);

                if (currentText === state.text) {
                    dispatch({ type: 'autocomplete-end', suggestions });
                }
            })();
        }
    }, [state.text]);

    useEffect(() => {
        if (state.isSubmitting) {
            (async () => {
                const url = await getListPageUrl(state.text);
                setNavigateTo(`/lst${url}`);
                // console.log(`window.location.href = '/lst${url}'`);
            })();
        }
    }, [state.isSubmitting]);

    return (
        <div>
            {state.requestingAutocomplete && <div>LOADING...</div>}
            {state.isSubmitting && <div>Submitting...</div>}

            <form
                className={styles.form}
                onSubmit={(e) => {
                    dispatch({ type: 'submit' });
                    e.preventDefault();
                }}
            >
                <input
                    className={styles.input}
                    type="search"
                    name="q"
                    value={state.text}
                    readOnly={state.isSubmitting}
                    onChange={(e) =>
                        dispatch({ type: 'autocomplete-start', query: (e.target as HTMLInputElement).value })
                    }
                    autoComplete="off"
                />
                <button className={styles.button}>GO</button>
            </form>

            {state.suggestions && (
                <ul>
                    {state.suggestions.map((s) => (
                        <li key={`autocomplete-suggestion-${s}`}>
                            <button onClick={() => dispatch({ type: 'submit', value: s })}>{s}</button>
                        </li>
                    ))}
                </ul>
            )}

            <button onClick={() => dispatch({ type: 'reset' })}>RESET</button>
            {navigateTo && (
                <a href={`https://www.autoscout24.de${navigateTo}`} target="_blank">
                    {navigateTo}
                </a>
            )}
        </div>
    );
};

export default AISearch;
