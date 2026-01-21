import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { CheckSquare, Plus, Trash2 } from 'lucide-react';
import './DashboardWidgets.css';

const TodoList = () => {
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(collection(db, 'users', currentUser.uid, 'todos'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTodos(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (!newTodo.trim() || !currentUser) return;

        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'todos'), {
                text: newTodo,
                completed: false,
                createdAt: serverTimestamp()
            });
            setNewTodo('');
        } catch (error) {
            console.error("Error adding todo:", error);
        }
    };

    const toggleTodo = async (todo) => {
        if (!currentUser) return;
        const todoRef = doc(db, 'users', currentUser.uid, 'todos', todo.id);
        await updateDoc(todoRef, { completed: !todo.completed });
    };

    const deleteTodo = async (id) => {
        if (!currentUser) return;
        await deleteDoc(doc(db, 'users', currentUser.uid, 'todos', id));
    };

    return (
        <div className="dashboard-widget-card todo-container">
            <div className="widget-header">
                <CheckSquare size={18} color="#64ffda" />
                <span>My Tasks</span>
            </div>

            <form onSubmit={handleAddTodo} className="todo-input-form">
                <input
                    type="text"
                    className="todo-input"
                    placeholder="Add a new task..."
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                />
                <button type="submit" className="add-todo-btn">
                    <Plus size={18} />
                </button>
            </form>

            <div className="todo-list">
                {todos.map(todo => (
                    <div key={todo.id} className="todo-item">
                        <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => toggleTodo(todo)}
                            className="todo-checkbox"
                        />
                        <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                            {todo.text}
                        </span>
                        <button onClick={() => deleteTodo(todo.id)} className="delete-todo-btn">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                {todos.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#8892b0', fontSize: '0.8rem', marginTop: '20px' }}>
                        No tasks yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodoList;
