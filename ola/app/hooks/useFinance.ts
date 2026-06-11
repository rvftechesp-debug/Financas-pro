"use client";

import { useMemo, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { Expense, Budget } from "@/app/types";

export const CATEGORIES = [
  { name: "Alimentação", icon: "🍽️", color: "#F97316" },
  { name: "Transporte", icon: "🚗", color: "#3B82F6" },
  { name: "Lazer", icon: "🎮", color: "#A855F7" },
  { name: "Moradia", icon: "🏠", color: "#10B981" },
  { name: "Assinaturas", icon: "📱", color: "#EC4899" },
  { name: "Outros", icon: "💡", color: "#EAB308" },
];

export const MONTHS = [
  "Jan","Fev","Mar","Abr","Mai","Jun",
  "Jul","Ago","Set","Out","Nov","Dez",
];

export interface IncomeEntry {
  id: number;
  description: string;
  type: string;
  amount: number;
  date: string;
}

const defaultBudgets: Budget[] = CATEGORIES.map(c => ({
  category: c.name,
  limit: 500,
}));

const initialExpenses: Expense[] = [
  { id: 1,  description: "Supermercado",      category: "Alimentação", amount: 450,  date: "2026-05-03" },
  { id: 2,  description: "Uber",              category: "Transporte",  amount: 80,   date: "2026-05-05" },
  { id: 3,  description: "Netflix + Spotify", category: "Assinaturas", amount: 65,   date: "2026-05-01" },
  { id: 4,  description: "Aluguel",           category: "Moradia",     amount: 1500, date: "2026-05-01" },
  { id: 5,  description: "Cinema",            category: "Lazer",       amount: 120,  date: "2026-05-10" },
  { id: 6,  description: "Farmácia",          category: "Outros",      amount: 90,   date: "2026-05-12" },
  { id: 7,  description: "iFood",             category: "Alimentação", amount: 200,  date: "2026-05-15" },
  { id: 8,  description: "Combustível",       category: "Transporte",  amount: 150,  date: "2026-05-18" },
  { id: 9,  description: "Supermercado",      category: "Alimentação", amount: 520,  date: "2026-06-02" },
  { id: 10, description: "Aluguel",           category: "Moradia",     amount: 1500, date: "2026-06-01" },
  { id: 11, description: "Uber",              category: "Transporte",  amount: 95,   date: "2026-06-05" },
  { id: 12, description: "Cinema",            category: "Lazer",       amount: 80,   date: "2026-06-08" },
  { id: 13, description: "Netflix + Spotify", category: "Assinaturas", amount: 65,   date: "2026-06-01" },
  { id: 14, description: "Supermercado",      category: "Alimentação", amount: 380,  date: "2026-04-03" },
  { id: 15, description: "Aluguel",           category: "Moradia",     amount: 1500, date: "2026-04-01" },
  { id: 16, description: "Uber",              category: "Transporte",  amount: 120,  date: "2026-04-05" },
  { id: 17, description: "Farmácia",          category: "Outros",      amount: 150,  date: "2026-04-12" },
  { id: 18, description: "Restaurante",       category: "Alimentação", amount: 180,  date: "2026-04-20" },
];

// ─── hook ────────────────────────────────────────────────────────────────────

export function useFinance(selectedMonth?: number) {
  const userId = (() => {
    if (typeof window === "undefined") return "guest";
    try {
      const session = window.localStorage.getItem("financas-session");
      if (!session) return "guest";
      const parsed = JSON.parse(session);
      return parsed?.id ?? "guest";
    } catch {
      return "guest";
    }
  })();

  const expensesKey = `financas-expenses-${userId}`;
  const incomeKey   = `financas-income-${userId}`;
  const budgetsKey  = `financas-budgets-${userId}`;
  const incomesKey  = `financas-incomes-${userId}`;

  const [expenses,     setExpenses]     = useLocalStorage<Expense[]>(expensesKey, initialExpenses);
  const [income,       setIncome]       = useLocalStorage<number>(incomeKey, 4500);
  const [budgets,      setBudgets]      = useLocalStorage<Budget[]>(budgetsKey, defaultBudgets);
  const [incomeEntries, setIncomeEntries] = useLocalStorage<IncomeEntry[]>(incomesKey, []);

  const month = selectedMonth ?? new Date().getMonth();

  const filtered = useMemo(() =>
    expenses.filter(e => new Date(e.date + "T00:00:00").getMonth() === month),
    [expenses, month]
  );

  // Receitas do mês selecionado
  const filteredIncomes = useMemo(() =>
    incomeEntries.filter(e => new Date(e.date + "T00:00:00").getMonth() === month),
    [incomeEntries, month]
  );

  const totalExpenses = useMemo(() =>
    filtered.reduce((s, e) => s + e.amount, 0),
    [filtered]
  );

  const balance     = income - totalExpenses;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return CATEGORIES.map(c => ({ ...c, value: map[c.name] || 0 }));
  }, [filtered]);

  const byCategoryFiltered = useMemo(() =>
    byCategory.filter(c => c.value > 0),
    [byCategory]
  );

  const sortedByCategory = useMemo(() =>
    [...byCategoryFiltered].sort((a, b) => b.value - a.value),
    [byCategoryFiltered]
  );

  const topCategory = sortedByCategory[0];

  const monthlyData = useMemo(() =>
    MONTHS.map((m, i) => {
      const total = expenses
        .filter(e => new Date(e.date + "T00:00:00").getMonth() === i)
        .reduce((s, e) => s + e.amount, 0);
      return { month: m, total };
    }),
    [expenses]
  );

  const incomeVsExpenses = useMemo(() =>
    MONTHS.map((m, i) => {
      const total = expenses
        .filter(e => new Date(e.date + "T00:00:00").getMonth() === i)
        .reduce((s, e) => s + e.amount, 0);
      return { month: m, gastos: total, renda: income, saldo: income - total };
    }),
    [expenses, income]
  );

  const budgetStatus = useMemo(() =>
    CATEGORIES.map(c => {
      const spent  = byCategory.find(b => b.name === c.name)?.value || 0;
      const budget = budgets.find(b => b.category === c.name)?.limit || 0;
      const pct    = budget > 0 ? (spent / budget) * 100 : 0;
      return { ...c, spent, budget, pct };
    }),
    [byCategory, budgets]
  );

  const addExpense = useCallback((form: {
    description: string;
    category: string;
    amount: string;
    date: string;
  }) => {
    if (!form.description || !form.amount || isNaN(parseFloat(form.amount))) return false;
    setExpenses(prev => [...prev, {
      ...form,
      id: Date.now(),
      amount: parseFloat(form.amount),
    }]);
    return true;
  }, [setExpenses]);

  const removeExpense = useCallback((id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, [setExpenses]);

  const updateExpense = useCallback((updated: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
  }, [setExpenses]);

  const updateIncome = useCallback((updated: IncomeEntry, oldAmount: number) => {
    setIncomeEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
    setIncome(prev => prev - oldAmount + updated.amount);
  }, [setIncomeEntries, setIncome]);

  const updateBudget = useCallback((category: string, limit: number) => {
    setBudgets(prev =>
      prev.map(b => b.category === category ? { ...b, limit } : b)
    );
  }, [setBudgets]);

  const getTip = useCallback(() => {
    if (!topCategory || totalExpenses === 0) return null;
    const pct     = (topCategory.value / totalExpenses) * 100;
    const savings = topCategory.value * 0.1;
    return {
      icon: topCategory.icon,
      categoryName: topCategory.name,
      pct: pct.toFixed(0),
      savings,
    };
  }, [topCategory, totalExpenses]);

  const tip = getTip();

  // Salva receita como lançamento individual E soma ao income total
  const addIncome = useCallback((
    amount: string,
    description: string = "Receita",
    type: string = "Salário",
    date: string = new Date().toISOString().split("T")[0]
  ) => {
    if (!amount || isNaN(parseFloat(amount))) return false;
    const value = parseFloat(amount);
    setIncomeEntries(prev => [...prev, {
      id: Date.now(),
      description,
      type,
      amount: value,
      date,
    }]);
    setIncome(prev => prev + value);
    return true;
  }, [setIncomeEntries, setIncome]);

  const removeIncome = useCallback((id: number, amount: number) => {
    setIncomeEntries(prev => prev.filter(e => e.id !== id));
    setIncome(prev => prev - amount);
  }, [setIncomeEntries, setIncome]);

  return {
    expenses,
    income,
    setIncome,
    budgets,
    updateBudget,
    filtered,
    filteredIncomes,
    incomeEntries,
    totalExpenses,
    balance,
    savingsRate,
    byCategory,
    byCategoryFiltered,
    sortedByCategory,
    topCategory,
    monthlyData,
    incomeVsExpenses,
    budgetStatus,
    addExpense,
    removeExpense,
    updateExpense,
    addIncome,
    removeIncome,
    updateIncome,
    tip,
    CATEGORIES,
    MONTHS,
  };
}
