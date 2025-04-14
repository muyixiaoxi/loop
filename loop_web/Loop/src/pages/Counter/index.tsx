import React from 'react';
import { observer } from 'mobx-react-lite';
import counterStore from '@/store/counterStore';

const Counter: React.FC = observer(() => {
    const { count, increment, decrement } = counterStore;

    return (
        <div>
            <h1>Count: {count}</h1>
            <button onClick={increment}>Increment</button>
            <button onClick={decrement}>Decrement</button>
        </div>
    );
});

export default Counter;