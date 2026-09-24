import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = "http://localhost:8080/dosegura/api/marketplace/medicamentos";

const demoMedicamentos = [
  { id: 1, nome: "Paracetamol", dosagem: "750 mg", fabricante: "Genérico", preco: 12.90, precoOriginal: 16.90, descontoPorcentagem: 24, estoqueDisponivel: 32, urlImagem: "" },
  { id: 2, nome: "Dipirona Sódica", dosagem: "500 mg", fabricante: "Medley", preco: 9.50, precoOriginal: 11.90, descontoPorcentagem: 20, estoqueDisponivel: 45, urlImagem: "" },
  { id: 3, nome: "Ibuprofeno", dosagem: "600 mg", fabricante: "Neo Química", preco: 18.90, precoOriginal: 22.90, descontoPorcentagem: 17, estoqueDisponivel: 18, urlImagem: "" },
  { id: 4, nome: "Losartana Potássica", dosagem: "50 mg", fabricante: "EMS", preco: 14.70, precoOriginal: 17.90, descontoPorcentagem: 18, estoqueDisponivel: 27, urlImagem: "" },
  { id: 5, nome: "Omeprazol", dosagem: "20 mg", fabricante: "Eurofarma", preco: 11.80, precoOriginal: 14.50, descontoPorcentagem: 19, estoqueDisponivel: 41, urlImagem: "" },
  { id: 6, nome: "Amoxicilina", dosagem: "500 mg", fabricante: "Germed", preco: 27.90, precoOriginal: 31.90, descontoPorcentagem: 13, estoqueDisponivel: 12, urlImagem: "" },
  { id: 7, nome: "Atorvastatina", dosagem: "20 mg", fabricante: "Sandoz", preco: 22.40, precoOriginal: 26.90, descontoPorcentagem: 17, estoqueDisponivel: 21, urlImagem: "" },
  { id: 8, nome: "Cetirizina", dosagem: "10 mg", fabricante: "Cimed", preco: 13.20, precoOriginal: 15.90, descontoPorcentagem: 17, estoqueDisponivel: 35, urlImagem: "" }
];

const money = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    pill: <><path d="M8.5 8.5 15.5 15.5"/><path d="M7.2 20.2a5.1 5.1 0 0 1 0-7.2l5.8-5.8a5.1 5.1 0 1 1 7.2 7.2l-5.8 5.8a5.1 5.1 0 0 1-7.2 0Z"/></>,
    heart: <path d="M20.8 8.8c0 5.4-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.8A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.6Z"/>,
    cart: <><path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L20 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    filter: <><path d="M4 6h16"/><path d="M7 12h10"/><path d="M10 18h4"/></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.8-4L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14.8 4L20 15"/><path d="M20 20v-5h-5"/></>
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function App() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("relevancia");
  const [onlyStock, setOnlyStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [selected, setSelected] = useState(null);

  async function loadMedicamentos() {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("API indisponível");
      const data = await response.json();
      setMedicamentos(Array.isArray(data) ? data : []);
      setUsingDemo(false);
    } catch {
      setMedicamentos(demoMedicamentos);
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMedicamentos(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = medicamentos.filter((m) => {
      const text = `${m.nome || ""} ${m.dosagem || ""} ${m.fabricante || ""}`.toLowerCase();
      return (!term || text.includes(term)) && (!onlyStock || Number(m.estoqueDisponivel) > 0);
    });

    return [...result].sort((a, b) => {
      if (sort === "menor-preco") return Number(a.preco) - Number(b.preco);
      if (sort === "maior-preco") return Number(b.preco) - Number(a.preco);
      if (sort === "nome") return String(a.nome).localeCompare(String(b.nome), "pt-BR");
      return 0;
    });
  }, [medicamentos, search, sort, onlyStock]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Icon name="pill" size={22} /></div>
          <div><strong>Dose Segura</strong><span>Saúde mais simples</span></div>
        </div>

        <nav className="nav">
          <a href="#"><Icon name="grid" /> Visão geral</a>
          <a className="active" href="#"><Icon name="pill" /> Medicamentos</a>
          <a href="#"><Icon name="heart" /> Meus medicamentos</a>
          <a href="#"><Icon name="cart" /> Pedidos</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="support-card">
            <span className="support-icon">?</span>
            <div><strong>Precisa de ajuda?</strong><p>Fale com nosso suporte.</p></div>
          </div>
          <div className="profile">
            <div className="avatar">DS</div>
            <div><strong>Meu perfil</strong><span>Paciente</span></div>
            <span className="dots">•••</span>
          </div>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <div className="eyebrow">CATÁLOGO</div>
            <h1>Todos os medicamentos</h1>
            <p>Encontre medicamentos, consulte preços e veja a disponibilidade.</p>
          </div>
          <button className="icon-button" aria-label="Notificações"><Icon name="bell" /></button>
        </header>

        <section className="toolbar">
          <label className="search-box">
            <Icon name="search" size={19} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, dosagem ou fabricante..."
            />
            {search && <button onClick={() => setSearch("")} aria-label="Limpar busca">×</button>}
          </label>

          <div className="toolbar-actions">
            <label className="stock-toggle">
              <input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} />
              <span>Somente em estoque</span>
            </label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar">
              <option value="relevancia">Mais relevantes</option>
              <option value="nome">Nome (A–Z)</option>
              <option value="menor-preco">Menor preço</option>
              <option value="maior-preco">Maior preço</option>
            </select>
          </div>
        </section>

        <div className="summary-row">
          <div><strong>{filtered.length}</strong> medicamentos encontrados</div>
          {usingDemo && <button className="api-warning" onClick={loadMedicamentos}><Icon name="refresh" size={16}/> API indisponível · usando dados de demonstração</button>}
        </div>

        {loading ? (
          <div className="state-card"><div className="spinner"></div><p>Carregando medicamentos...</p></div>
        ) : filtered.length === 0 ? (
          <div className="state-card empty">
            <div className="empty-icon"><Icon name="search" size={28}/></div>
            <h2>Nenhum medicamento encontrado</h2>
            <p>Tente buscar por outro nome ou remova os filtros.</p>
            <button className="primary" onClick={() => { setSearch(""); setOnlyStock(false); }}>Limpar filtros</button>
          </div>
        ) : (
          <section className="medicine-grid">
            {filtered.map((m) => (
              <article className="medicine-card" key={m.id}>
                <div className="card-top">
                  {Number(m.descontoPorcentagem) > 0 && <span className="discount">-{m.descontoPorcentagem}%</span>}
                  <button className="favorite" aria-label={`Favoritar ${m.nome}`}><Icon name="heart" size={18}/></button>
                </div>
                <div className="medicine-image">
                  {m.urlImagem ? <img src={m.urlImagem} alt="" /> : <div className="pill-illustration"><Icon name="pill" size={42}/></div>}
                </div>
                <div className="medicine-info">
                  <span className="manufacturer">{m.fabricante || "Fabricante não informado"}</span>
                  <h2>{m.nome}</h2>
                  <p className="dosage">{m.dosagem || "Dosagem não informada"}</p>
                  <div className="price-line">
                    <div>
                      {Number(m.precoOriginal) > Number(m.preco) && <del>{money(m.precoOriginal)}</del>}
                      <strong>{money(m.preco)}</strong>
                    </div>
                    <span className={Number(m.estoqueDisponivel) > 0 ? "stock in" : "stock out"}>
                      {Number(m.estoqueDisponivel) > 0 ? `${m.estoqueDisponivel} em estoque` : "Sem estoque"}
                    </span>
                  </div>
                  <button className="details" onClick={() => setSelected(m)}>Ver detalhes <Icon name="chevron" size={17}/></button>
                </div>
              </article>
            ))}
          </section>
        )}

        <footer>Informações de preço e disponibilidade podem variar. Consulte um profissional de saúde para orientações sobre o uso de medicamentos.</footer>
      </main>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            <div className="modal-icon"><Icon name="pill" size={34}/></div>
            <span className="manufacturer">{selected.fabricante || "Fabricante não informado"}</span>
            <h2>{selected.nome}</h2>
            <p className="modal-dose">{selected.dosagem || "Dosagem não informada"}</p>
            <div className="detail-grid">
              <div><span>Preço</span><strong>{money(selected.preco)}</strong></div>
              <div><span>Estoque</span><strong>{selected.estoqueDisponivel || 0} unidades</strong></div>
            </div>
            <button className="primary full" onClick={() => setSelected(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
