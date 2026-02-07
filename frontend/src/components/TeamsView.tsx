import { useState, useEffect } from 'react';
import { Team, TeamMember, TeamInvitation } from '../types/database.types';
import { api } from '../utils/api';
import './TeamsView.css';

export function TeamsView() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});
  const [teamInvitations, setTeamInvitations] = useState<Record<string, TeamInvitation[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', max_members: 10 });
  const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitingTeamId, setInvitingTeamId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const result = await api.get<Team[]>('/api/teams');
      
      if (result.success && result.data) {
        setTeams(result.data);
        // Fetch members and invitations for each team
        result.data.forEach((team: Team) => {
          fetchTeamMembers(team.id);
          fetchTeamInvitations(team.id);
        });
      } else {
        console.error('Error fetching teams:', result.error);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const result = await api.get<TeamMember[]>(`/api/teams/${teamId}/members`);
      
      if (result.success && result.data) {
        setTeamMembers(prev => ({ ...prev, [teamId]: result.data || [] }));
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchTeamInvitations = async (teamId: string) => {
    try {
      const result = await api.get<TeamInvitation[]>(`/api/teams/${teamId}/invitations`);
      
      if (result.success && result.data) {
        setTeamInvitations(prev => ({ ...prev, [teamId]: result.data || [] }));
      }
    } catch (error) {
      console.error('Error fetching team invitations:', error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate emails
    const validEmails = inviteEmails
      .filter(email => email.trim() !== '')
      .map(email => email.trim());
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validEmails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      alert(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      return;
    }

    // Check if invites exceed team capacity (owner + invites <= max_members)
    if (validEmails.length + 1 > formData.max_members) {
      alert(`Too many invitations! You can invite up to ${formData.max_members - 1} members (owner counts as 1).`);
      return;
    }
    
    try {
      const result = await api.post<Team>('/api/teams', {
        ...formData,
        invite_emails: validEmails
      });

      if (result.success) {
        alert(`Team created successfully! ${validEmails.length > 0 ? `Invitations sent to ${validEmails.length} member(s).` : ''}`);
        setFormData({ name: '', description: '', max_members: 10 });
        setInviteEmails(['']);
        setShowForm(false);
        fetchTeams();
      } else {
        alert(result.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team. Make sure the backend API is running.');
    }
  };

  const addEmailField = () => {
    if (inviteEmails.length < formData.max_members - 1) {
      setInviteEmails([...inviteEmails, '']);
    } else {
      alert(`Maximum ${formData.max_members - 1} invitations allowed (owner counts as 1)`);
    }
  };

  const removeEmailField = (index: number) => {
    const newEmails = inviteEmails.filter((_, i) => i !== index);
    setInviteEmails(newEmails.length === 0 ? [''] : newEmails);
  };

  const updateEmailField = (index: number, value: string) => {
    const newEmails = [...inviteEmails];
    newEmails[index] = value;
    setInviteEmails(newEmails);
  };

  const handleInviteMember = async (teamId: string) => {
    if (!inviteEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      const result = await api.post(`/api/teams/${teamId}/invite`, { email: inviteEmail });

      if (result.success) {
        alert(result.message || 'Member added successfully!');
        setInviteEmail('');
        setInvitingTeamId(null);
        fetchTeamMembers(teamId);
        fetchTeamInvitations(teamId);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to invite member');
    }
  };

  const handleCancelInvitation = async (invitationId: string, teamId: string) => {
    if (!confirm('Cancel this invitation?')) return;

    try {
      const response = await fetch(`/api/teams/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        fetchTeamInvitations(teamId);
      }
    } catch (error) {
      console.error('Error canceling invitation:', error);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const result = await api.delete(`/api/teams/${id}`);

      if (result.success) {
        alert('Team deleted successfully');
        fetchTeams();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team');
    }
  };

  if (loading) {
    return <div className="teams-view-loading">Loading teams...</div>;
  }

  return (
    <div className="teams-view-container">
      <div className="teams-view-header">
        <h2>Your Teams</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-create-team">
          {showForm ? 'Cancel' : '+ New Team'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateTeam} className="team-form-inline">
          <div className="form-row">
            <div className="form-group">
              <label>Team Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter team name"
              />
            </div>
            <div className="form-group">
              <label>Max Members *</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.max_members}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value) || 10;
                  setFormData({ ...formData, max_members: newMax });
                  // Trim emails if new max is lower
                  if (inviteEmails.length > newMax - 1) {
                    setInviteEmails(inviteEmails.slice(0, newMax - 1));
                  }
                }}
                required
                placeholder="10"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter team description (optional)"
              rows={3}
            />
          </div>

          {/* Invite Members Section */}
          <div className="form-group">
            <label>Invite Members (Optional)</label>
            <div className="invite-emails-container">
              {inviteEmails.map((email, index) => (
                <div key={index} className="email-input-row">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmailField(index, e.target.value)}
                    placeholder={`member${index + 1}@example.com`}
                    className="invite-email-input"
                  />
                  {inviteEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmailField(index)}
                      className="btn-remove-email"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {inviteEmails.length < formData.max_members - 1 && (
                <button
                  type="button"
                  onClick={addEmailField}
                  className="btn-add-email"
                >
                  + Add Another Email ({formData.max_members - 1 - inviteEmails.length} slots left)
                </button>
              )}
            </div>
            <p className="form-helper-text">
              You can invite up to {formData.max_members - 1} members (you'll be the owner)
            </p>
          </div>

          <button type="submit" className="btn-submit-team">
            Create Team & Send Invitations
          </button>
        </form>
      )}

      <div className="teams-grid">
        {teams.length === 0 ? (
          <div className="teams-empty">
            <p>No teams yet. Create your first team to get started!</p>
          </div>
        ) : (
          teams.map(team => {
            const members = teamMembers[team.id] || [];
            const invitations = teamInvitations[team.id] || [];
            const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
            const availableSlots = team.max_members - members.length;

            return (
              <div key={team.id} className="team-card-inline">
                <div className="team-info">
                  <div className="team-header-inline">
                    <h3>{team.name}</h3>
                    <span className="member-count-badge">
                      {members.length} / {team.max_members}
                    </span>
                  </div>
                  {team.description && <p>{team.description}</p>}
                  
                  {/* Members Section */}
                  <div className="team-section">
                    <h4>Members</h4>
                    {members.length === 0 ? (
                      <p className="empty-text">No members yet</p>
                    ) : (
                      <ul className="member-list">
                        {members.map(member => (
                          <li key={member.id}>
                            <span className="member-email">{member.email}</span>
                            <span className={`member-role ${member.role}`}>{member.role}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Pending Invitations Section */}
                  {pendingInvitations.length > 0 && (
                    <div className="team-section">
                      <h4>Pending Invitations</h4>
                      <ul className="invitation-list">
                        {pendingInvitations.map(inv => (
                          <li key={inv.id}>
                            <span className="invitation-email">{inv.email}</span>
                            <button
                              onClick={() => handleCancelInvitation(inv.id, team.id)}
                              className="btn-cancel-invite"
                            >
                              Cancel
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Invite Member Section */}
                  {availableSlots > 0 && (
                    <div className="team-section invite-section">
                      {invitingTeamId === team.id ? (
                        <div className="invite-form">
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="invite-input"
                          />
                          <div className="invite-actions">
                            <button
                              onClick={() => handleInviteMember(team.id)}
                              className="btn-send-invite"
                            >
                              Send
                            </button>
                            <button
                              onClick={() => {
                                setInvitingTeamId(null);
                                setInviteEmail('');
                              }}
                              className="btn-cancel-invite-form"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setInvitingTeamId(team.id)}
                          className="btn-invite-member"
                        >
                          + Invite Member ({availableSlots} slots left)
                        </button>
                      )}
                    </div>
                  )}

                  {availableSlots === 0 && (
                    <p className="team-full-text">Team is full</p>
                  )}

                  <div className="team-meta">
                    <span className="team-id">ID: {team.id.substring(0, 8)}...</span>
                    <span className="team-date">
                      Created: {new Date(team.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="team-actions">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(team.id);
                      alert('Team ID copied to clipboard!');
                    }}
                    className="btn-copy-inline"
                  >
                    Copy ID
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="btn-delete-inline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

