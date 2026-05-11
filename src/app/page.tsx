import { createClient } from '@supabase/supabase-js'

export default async function Home() {
  // Инициализируем клиент (на бэкенде)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Запрос к нашей новой таблице
  const { data: banks } = await supabase.from('banks').select('*')

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold mb-6">ExpatFinance Navigator: Банки Сербии</h1>
      <div className="grid gap-4">
        {banks?.map((bank) => (
          <div key={bank.id} className="p-4 border rounded shadow-sm bg-white">
            <h2 className="font-semibold text-lg text-blue-600">{bank.name}</h2>
            <p className="text-gray-600">Сайт: {bank.official_site}</p>
            <div className="mt-2">
              <span className={`px-2 py-1 text-xs rounded ${bank.ru_support ? 'bg-green-100 text-green-800' : 'bg-red-100'}`}>
                {bank.ru_support ? 'Поддерживает РФ паспорта' : 'Сложно открыть'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
