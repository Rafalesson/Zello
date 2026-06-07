import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Zello',
  description: 'Política de privacidade da plataforma de telemedicina Zello.',
};

export default function PrivacidadePage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
      <article>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Política de Privacidade
        </h1>

        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">1. Introdução</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            A plataforma Zello (&quot;Plataforma&quot;) é um ambiente de telemedicina que conecta médicos e pacientes de
            forma digital. Esta política descreve como os dados pessoais são coletados, utilizados, armazenados e
            protegidos, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">2. Dados Coletados</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Para operar a plataforma, os seguintes dados podem ser coletados:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-400">
            <li>Nome completo, e-mail e senha (para cadastro e autenticação)</li>
            <li>CRM, especialidade e foto de perfil (para médicos)</li>
            <li>CPF, data de nascimento e dados de contato (para pacientes)</li>
            <li>Informações de pré-triagem (sintomas relatados antes da consulta)</li>
            <li>Registros de prontuário, prescrições e atestados médicos</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">3. Base Legal (LGPD)</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            O tratamento de dados de saúde na plataforma é fundamentado nas seguintes bases legais da LGPD:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-400">
            <li><strong className="text-slate-700 dark:text-slate-300">Art. 7º, I:</strong> Consentimento do titular</li>
            <li><strong className="text-slate-700 dark:text-slate-300">Art. 11, II, f:</strong> Tutela da saúde em procedimento realizado por profissional de saúde</li>
            <li><strong className="text-slate-700 dark:text-slate-300">Art. 7º, V:</strong> Execução de contrato</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">4. Retenção e Exclusão de Dados</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Dados e documentos gerados na plataforma são automaticamente removidos após <strong className="text-slate-700 dark:text-slate-300">100 dias</strong>,
            incluindo PDFs armazenados no serviço de cloud e registros no banco de dados. Este mecanismo implementa
            uma política de retenção conforme as diretrizes da LGPD.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">5. Segurança</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            A plataforma utiliza as seguintes medidas de segurança para proteger seus dados:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-400">
            <li>Comunicação via HTTPS (TLS 1.2+)</li>
            <li>Autenticação via JWT com expiração e refresh token</li>
            <li>Senhas armazenadas com hash bcrypt (salt rounds ≥ 10)</li>
            <li>Criptografia em repouso AES-256 (nativa do banco de dados)</li>
            <li>Controle de acesso baseado em papéis (RBAC)</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">6. Direitos do Titular</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Em conformidade com a LGPD, você pode exercer os seguintes direitos:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-400">
            <li>Acessar seus dados cadastrais</li>
            <li>Solicitar a correção de dados incompletos</li>
            <li>Solicitar a exclusão de sua conta e dados associados</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">7. Regulamentação de Telemedicina</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            A plataforma opera em conformidade com a regulamentação brasileira de telemedicina:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-400">
            <li><strong className="text-slate-700 dark:text-slate-300">Resolução CFM 2.314/2022:</strong> Termo de consentimento digital obrigatório pré-consulta</li>
            <li><strong className="text-slate-700 dark:text-slate-300">Lei 14.510/2022:</strong> Telemedicina é complementar ao atendimento presencial</li>
          </ul>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">8. Contato</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Para dúvidas sobre esta política de privacidade ou sobre o tratamento dos seus dados, entre em contato pelo
            e-mail: <a href="mailto:contato@zello.com" className="text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 transition-colors font-medium">contato@zello.com</a>.
          </p>
        </section>

        <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-6 text-sm text-slate-400 dark:text-slate-500">
          <p>Última atualização: Maio de 2026</p>
        </div>
      </article>
    </main>
  );
}
