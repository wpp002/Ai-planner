'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, setSession } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function RegisterPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      setSession(data.accessToken);
      router.push('/dashboard');
    } catch {
      setError(language === 'th' ? 'สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบข้อมูล' : 'Registration failed. Please check your information.');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center px-4 py-10">
      <Card className="w-full max-w-md bg-white/95">
        <CardHeader>
          <div className="mb-2 flex justify-end">
            <LanguageSwitcher />
          </div>
          <CardTitle className="text-2xl">{t.createAccount}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.brand} · {t.tagline}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t.name}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t.email}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t.password}</Label>
              <Input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full">{t.register}</Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            {language === 'th' ? 'มีบัญชีแล้ว?' : 'Already have an account?'} <Link className="font-medium text-primary" href="/login">{t.login}</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
