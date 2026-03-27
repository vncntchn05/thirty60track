// Client exercises tab — read-only view of the exercise library.
// Re-uses the shared exercises screen; edit/add controls are hidden automatically
// because useAuth() returns role === 'client' inside that component.
export { default } from '../(tabs)/exercises';
