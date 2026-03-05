import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import characterController from '../controllers/CharacterController';
import Character from '../models/Character';
import './CharacterDisplay.css';

const STAT_CONFIG = {
    totalLevel:   { label: 'Level', min: 1, max: 20 },
    totalHp:      { label: 'HP',    min: 1, max: 9999 },
    strength:     { label: 'STR',   min: 1, max: 30 },
    dexterity:    { label: 'DEX',   min: 1, max: 30 },
    constitution: { label: 'CON',   min: 1, max: 30 },
    intelligence: { label: 'INT',   min: 1, max: 30 },
    wisdom:       { label: 'WIS',   min: 1, max: 30 },
    charisma:     { label: 'CHA',   min: 1, max: 30 },
};

const ABILITY_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

function CharacterDisplay() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [character, setCharacter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [editing, setEditing] = useState(false);
    const [editStats, setEditStats] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);

    useEffect(() => {
        fetchCharacter();
    }, [id]);

    const fetchCharacter = async () => {
        try {
            setLoading(true);
            setError(null);
            const char = await characterController.getCharacter(id);
            setCharacter(char);
        } catch (err) {
            setError(err.message || 'Failed to fetch character');
            console.error('Error fetching character:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => navigate('/');

    const startEditing = () => {
        setEditStats({
            totalLevel: character.totalLevel,
            totalHp: character.totalHp,
            strength: character.strength,
            dexterity: character.dexterity,
            constitution: character.constitution,
            intelligence: character.intelligence,
            wisdom: character.wisdom,
            charisma: character.charisma,
        });
        setSaveError(null);
        setEditing(true);
    };

    const cancelEditing = () => {
        setEditing(false);
        setSaveError(null);
    };

    const adjustStat = (key, delta) => {
        setEditStats(prev => {
            const { min, max } = STAT_CONFIG[key];
            const clamped = Math.min(max, Math.max(min, prev[key] + delta));
            return { ...prev, [key]: clamped };
        });
    };

    const handleSubmit = async () => {
        const preview = new Character({ ...character, ...editStats });
        const { isValid, errors } = preview.validate();
        if (!isValid) {
            setSaveError(errors.join(', '));
            return;
        }

        try {
            setSaving(true);
            setSaveError(null);
            const payload = {
                total_level: editStats.totalLevel,
                total_hp: editStats.totalHp,
                strength: editStats.strength,
                dexterity: editStats.dexterity,
                constitution: editStats.constitution,
                intelligence: editStats.intelligence,
                wisdom: editStats.wisdom,
                charisma: editStats.charisma,
            };
            const updated = await characterController.updateCharacter(id, payload);
            setCharacter(updated);
            setEditing(false);
        } catch (err) {
            setSaveError(err.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="character-display loading">
                <div className="spinner"></div>
                <p>Loading character...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="character-display error">
                <div className="error-icon">⚠️</div>
                <h2>Error Loading Character</h2>
                <p>{error}</p>
                <button onClick={fetchCharacter} className="retry-button">
                    Retry
                </button>
            </div>
        );
    }

    if (!character) {
        return (
            <div className="character-display empty">
                <p>No character found</p>
            </div>
        );
    }

    const displayStats = editing ? editStats : character;
    const modifiers = {
        strength:     Character.getModifier(displayStats.strength),
        dexterity:    Character.getModifier(displayStats.dexterity),
        constitution: Character.getModifier(displayStats.constitution),
        intelligence: Character.getModifier(displayStats.intelligence),
        wisdom:       Character.getModifier(displayStats.wisdom),
        charisma:     Character.getModifier(displayStats.charisma),
    };

    const formatModifier = (mod) => (mod >= 0 ? `+${mod}` : `${mod}`);

    const StatAdjuster = ({ statKey }) => {
        const { label, min, max } = STAT_CONFIG[statKey];
        const value = editStats[statKey];
        return (
            <div className="stat-adjuster">
                <button
                    className="stat-arrow stat-down"
                    onClick={() => adjustStat(statKey, -1)}
                    disabled={value <= min || saving}
                    aria-label={`Decrease ${label}`}
                >▼</button>
                <span className="stat-value">{value}</span>
                <button
                    className="stat-arrow stat-up"
                    onClick={() => adjustStat(statKey, 1)}
                    disabled={value >= max || saving}
                    aria-label={`Increase ${label}`}
                >▲</button>
            </div>
        );
    };

    return (
        <div className="character-display">
            <button onClick={handleBack} className="back-button">
                ← Back to Characters
            </button>
            <div className="character-header">
                <h1>{character.charName}</h1>
                <div className="character-basics">
                    <span className="level">
                        Level {displayStats.totalLevel}
                        {editing && <StatAdjuster statKey="totalLevel" />}
                    </span>
                    <span className="hp">
                        HP: {displayStats.totalHp}
                        {editing && <StatAdjuster statKey="totalHp" />}
                    </span>
                    <span className="initiative">Initiative: {formatModifier(character.initiativeBonus)}</span>
                </div>
            </div>

            <div className="character-body">
                <div className="ability-scores">
                    <h2>Ability Scores</h2>
                    <div className="abilities-grid">
                        {ABILITY_KEYS.map(key => (
                            <div className="ability-card" key={key}>
                                <div className="ability-name">{STAT_CONFIG[key].label}</div>
                                <div className="ability-score">{displayStats[key]}</div>
                                <div className="ability-modifier">{formatModifier(modifiers[key])}</div>
                                {editing && <StatAdjuster statKey={key} />}
                            </div>
                        ))}
                    </div>
                </div>

                {character.languages && (
                    <div className="languages-section">
                        <h2>Languages</h2>
                        <p>{character.languages}</p>
                    </div>
                )}

                <div className="character-meta">
                    <p className="meta-item">
                        <strong>Character ID:</strong> {character.id}
                    </p>
                    <p className="meta-item">
                        <strong>User ID:</strong> {character.userId}
                    </p>
                </div>
            </div>

            {saveError && (
                <div className="save-error">
                    <span className="save-error-icon">⚠️</span> {saveError}
                </div>
            )}

            <div className="character-footer">
                {!editing ? (
                    <>
                        <button onClick={startEditing} className="edit-button">
                            ✏️ Edit Stats
                        </button>
                        <button onClick={fetchCharacter} className="refresh-button">
                            🔄 Refresh
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={handleSubmit} className="save-button" disabled={saving}>
                            {saving ? 'Saving...' : '💾 Save Changes'}
                        </button>
                        <button onClick={cancelEditing} className="cancel-button" disabled={saving}>
                            ✖ Cancel
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default CharacterDisplay;
