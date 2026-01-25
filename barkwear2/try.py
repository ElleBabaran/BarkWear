from barkwear2.utils.staffdb import staff_db

# Create your first admin
staff_db.create_user("admin", "Admin#123")
print("✅ First admin created")
