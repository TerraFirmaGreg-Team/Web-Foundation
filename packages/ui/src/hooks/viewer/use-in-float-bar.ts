'use client';
import { createContext, useContext } from 'react';

export const FloatBarContext = createContext(false);

export const useInFloatBar = () => useContext(FloatBarContext);

