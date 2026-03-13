'use client';
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;
  constructor(context: SecurityRuleContext) {
    const { path, operation } = context;
    const message = `Firestore Permission Denied on ${operation} for path: ${path}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
  }
}
