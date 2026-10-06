import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { cleanup } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from '../App'
import { within } from '@testing-library/react'

afterEach(() => { cleanup(); localStorage.clear() })

test('renders the sign-in experience', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeTruthy()
})

test('opens the synthetic dashboard, records, and upload dialog', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /Explore with synthetic demo data/i }))
  expect(screen.getByRole('heading', { name: 'Good day, Alex' })).toBeTruthy()
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('button', { name: /Medical records/i }))
  expect(screen.getByRole('heading', { name: 'Medical records' })).toBeTruthy()
  expect(screen.getByText('Annual blood panel.pdf')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Upload record' }))
  expect(screen.getByRole('dialog', { name: 'Upload medical record' })).toBeTruthy()
})
