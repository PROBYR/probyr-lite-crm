// Global variables
let allContacts = [];
let filteredContacts = [];
let currentContactView = 'table';
let currentSort = { column: 'name', direction: 'asc' };
let selectedContacts = new Set();
let currentContact = null;
let allCompanies = [];

// Tab Navigation
document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    loadData();
    setupNavigation();
    setupForms();
    setupContactSearch();
    setContactView('table'); // Default to table view
});

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.dataset.tab;
            
            // Update active nav item
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(t => t.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            
            // Update header
            const titles = {
                dashboard: 'Dashboard',
                pipeline: 'CRM Pipeline',
                contacts: 'Contacts',
                companies: 'Companies',
                approvals: 'Approvals',
                inbox: 'CRM Inbox',
                mailboxes: 'Mailboxes',
                analytics: 'Analytics',
                settings: 'Settings',
                integrations: 'Integrations'
            };
            
            document.getElementById('pageTitle').textContent = titles[tabName];
            document.getElementById('breadcrumb').textContent = `Home > ${titles[tabName]}`;
        });
    });
}

function setupContactSearch() {
    const searchInput = document.getElementById('contactSearch');
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        filteredContacts = allContacts.filter(contact => 
            contact.name.toLowerCase().includes(query) ||
            (contact.email && contact.email.toLowerCase().includes(query)) ||
            (contact.phone && contact.phone.toLowerCase().includes(query)) ||
            (contact.company_name && contact.company_name.toLowerCase().includes(query)) ||
            (contact.position && contact.position.toLowerCase().includes(query))
        );
        displayContacts();
    });
}

// Selection Functions
function toggleContactSelection(contactId) {
    if (selectedContacts.has(contactId)) {
        selectedContacts.delete(contactId);
    } else {
        selectedContacts.add(contactId);
    }
    updateSelectionState();
    displayContacts(); // Refresh to show selection state
}

function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox.checked) {
        // Select all visible contacts
        filteredContacts.forEach(contact => selectedContacts.add(contact.id));
    } else {
        // Deselect all
        selectedContacts.clear();
    }
    updateSelectionState();
    displayContacts();
}

function updateSelectionState() {
    const selectionCount = selectedContacts.size;
    const bulkActionsBar = document.getElementById('bulkActionsBar');
    const selectionCountSpan = document.getElementById('selectionCount');
    const selectAllCheckbox = document.getElementById('selectAll');
    
    // Show/hide bulk actions bar
    bulkActionsBar.style.display = selectionCount > 0 ? 'block' : 'none';
    
    // Update selection count text
    selectionCountSpan.textContent = `${selectionCount} contact${selectionCount !== 1 ? 's' : ''} selected`;
    
    // Update select all checkbox state
    const visibleContactIds = filteredContacts.map(c => c.id);
    const visibleSelectedCount = visibleContactIds.filter(id => selectedContacts.has(id)).length;
    
    selectAllCheckbox.checked = visibleSelectedCount === visibleContactIds.length && visibleContactIds.length > 0;
    selectAllCheckbox.indeterminate = visibleSelectedCount > 0 && visibleSelectedCount < visibleContactIds.length;
}

function clearSelection() {
    selectedContacts.clear();
    updateSelectionState();
    displayContacts();
}

// Contact Profile Functions
async function openContactProfile(contactId) {
    try {
        const response = await fetch(`/api/contacts/${contactId}`);
        if (!response.ok) throw new Error('Contact not found');
        
        const contact = await response.json();
        currentContact = contact;
        
        // Update modal content
        document.getElementById('contactProfileName').textContent = contact.name;
        document.getElementById('contactProfileInfo').innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                <div><strong>Email:</strong> ${contact.email ? '<a href="mailto:' + contact.email + '">' + contact.email + '</a>' : 'N/A'}</div>
                <div><strong>Phone:</strong> ${contact.phone ? '<a href="tel:' + contact.phone + '">' + contact.phone + '</a>' : 'N/A'}</div>
                <div><strong>Mobile:</strong> ${contact.mobile ? '<a href="tel:' + contact.mobile + '">' + contact.mobile + '</a>' : 'N/A'}</div>
                <div><strong>Company:</strong> ${contact.company_name || 'N/A'}</div>
                <div><strong>Position:</strong> ${contact.position || 'N/A'}</div>
                <div><strong>Department:</strong> ${contact.department || 'N/A'}</div>
                <div><strong>Lead Status:</strong> ${contact.lead_status || 'N/A'}</div>
                <div><strong>Priority:</strong> ${contact.priority || 'N/A'}</div>
                <div><strong>Address:</strong> ${contact.address || 'N/A'}</div>
                <div><strong>City:</strong> ${contact.city || 'N/A'}</div>
                <div><strong>State:</strong> ${contact.state || 'N/A'}</div>
                <div><strong>Country:</strong> ${contact.country || 'N/A'}</div>
                <div><strong>Birthday:</strong> ${contact.birthday ? new Date(contact.birthday).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Last Contacted:</strong> ${contact.last_contacted ? new Date(contact.last_contacted).toLocaleDateString() : 'Never'}</div>
                <div style="grid-column: 1 / -1;"><strong>Notes:</strong> ${contact.notes || 'No notes'}</div>
            </div>
        `;
        
        // Update activity timeline
        displayActivityTimeline(contact.activities || []);
        
        // Update sidebar
        displayRecentTasks(contact.tasks || []);
        displayUpcomingMeetings(contact.meetings || []);
        
        // Show modal
        document.getElementById('contactProfileModal').style.display = 'block';
        
    } catch (error) {
        alert('Error loading contact: ' + error.message);
    }
}

function closeContactProfile() {
    document.getElementById('contactProfileModal').style.display = 'none';
    currentContact = null;
}

// Edit Contact Functions
async function openEditContactModal(contactId) {
    try {
        const response = await fetch(`/api/contacts/${contactId}`);
        if (!response.ok) throw new Error('Contact not found');
        
        const contact = await response.json();
        
        // Populate form fields
        document.getElementById('editContactId').value = contact.id;
        document.getElementById('editContactName').value = contact.name || '';
        document.getElementById('editContactEmail').value = contact.email || '';
        document.getElementById('editContactPhone').value = contact.phone || '';
        document.getElementById('editContactMobile').value = contact.mobile || '';
        document.getElementById('editContactCompany').value = contact.company_id || '';
        document.getElementById('editContactPosition').value = contact.position || '';
        document.getElementById('editContactDepartment').value = contact.department || '';
        document.getElementById('editContactLeadStatus').value = contact.lead_status || 'New Lead';
        document.getElementById('editContactPriority').value = contact.priority || 'Medium';
        document.getElementById('editContactAddress').value = contact.address || '';
        document.getElementById('editContactCity').value = contact.city || '';
        document.getElementById('editContactState').value = contact.state || '';
        document.getElementById('editContactZip').value = contact.zip_code || '';
        document.getElementById('editContactCountry').value = contact.country || '';
        document.getElementById('editContactBirthday').value = contact.birthday ? contact.birthday.split('T')[0] : '';
        document.getElementById('editContactNotes').value = contact.notes || '';
        
        // Populate company dropdown
        const companySelect = document.getElementById('editContactCompany');
        companySelect.innerHTML = '<option value="">Select Company</option>' + 
            allCompanies.map(company => `<option value="${company.id}" ${company.id === contact.company_id ? 'selected' : ''}>${company.name}</option>`).join('');
        
        // Show modal
        document.getElementById('editContactModal').style.display = 'block';
        
    } catch (error) {
        alert('Error loading contact: ' + error.message);
    }
}

function closeEditContact() {
    document.getElementById('editContactModal').style.display = 'none';
}

function editContact() {
    if (currentContact) {
        openEditContactModal(currentContact.id);
    }
}

// Delete Contact Function
async function deleteContact(contactId) {
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/contacts/${contactId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from selected if selected
            selectedContacts.delete(contactId);
            
            // Reload data
            await loadData();
            
            // Close profile modal if this contact was open
            if (currentContact && currentContact.id === contactId) {
                closeContactProfile();
            }
            
            alert('Contact deleted successfully');
        } else {
            throw new Error('Failed to delete contact');
        }
    } catch (error) {
        alert('Error deleting contact: ' + error.message);
    }
}

// Additional functions will be loaded from separate files...