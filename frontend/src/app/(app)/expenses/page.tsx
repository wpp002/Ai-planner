import { ReceiptText } from 'lucide-react';
import { ModulePlaceholder } from '@/components/module-placeholder';

export default function ExpensesWorkspacePage() {
  return <ModulePlaceholder title="Expenses" description="A centralized workspace for trip expenses, reimbursement notes, and spending patterns." icon={ReceiptText} />;
}
