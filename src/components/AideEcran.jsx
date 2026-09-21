import './AideEcran.css'

export default function AideEcran({ onFermer }) {
  return (
    <div className="aide-overlay">
      <button className="aide-close-btn" onClick={onFermer} type="button" aria-label="Fermer">
        ✕
      </button>

      <div className="aide-content">
        <h2 className="aide-title">🎲 Comment jouer</h2>

        <div className="aide-section">
          <div className="section-title">Les Quêtes</div>
          <p className="aide-text">
            Chaque quête est un petit défi à réaliser pendant vos parties (gagner sans aide, enchaîner
            des victoires, survivre à une série de défaites...). Quand tu penses en avoir réussi une,
            clique sur "Valider une quête" : elle passe en attente jusqu'à ce que la majorité des
            joueurs présents à la session confirment t'avoir vu la réussir. Une fois validée, tu gagnes
            l'XP associé.
          </p>
          <p className="aide-text-dim">
            Une même quête ne peut être retentée qu'une fois par jour.
          </p>
        </div>

        <div className="aide-section">
          <div className="section-title">L'XP et les niveaux</div>
          <p className="aide-text">
            Chaque quête réussie te fait gagner de l'XP. Accumule assez d'XP pour monter de niveau, et
            à chaque niveau tu gagnes 1 point de compétence à investir dans les Alis.
          </p>
        </div>

        <div className="aide-section">
          <div className="section-title">Les Alis</div>
          <p className="aide-text">
            Les Alis sont des pouvoirs à débloquer avec tes points de compétence, répartis en 6 Arcs
            thématiques (Destin, Stratège, Influence, Gardien, Filou, Alliance). Dans chaque Arc, les
            pouvoirs se débloquent dans l'ordre, et coûtent de plus en plus cher (1, 3, 5 puis 10 points).
          </p>
        </div>

        <div className="aide-section">
          <div className="section-title">Les Sessions</div>
          <p className="aide-text">
            Pour utiliser une Alis ou valider une quête, il faut être dans une session active, un
            groupe d'au moins 3 amis réunis pour jouer. Le créateur fixe, au lancement, un budget de
            points d'Alis utilisables par joueur pour cette session. Utiliser une Alis de niveau 3
            coûte 3 points de ce budget, et une même Alis ne peut être utilisée qu'une fois par
            session.
          </p>
        </div>
      </div>
    </div>
  )
}
