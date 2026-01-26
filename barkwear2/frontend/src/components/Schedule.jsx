import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

export default function Schedule() {
  const [schedules, setSchedules] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    block: '',
    time: '',
    room: '',
    professor: ''
  });

  const resetForm = () => {
    setFormData({
      subject: '',
      block: '',
      time: '',
      room: '',
      professor: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdd = () => {
    if (formData.subject && formData.block && formData.time && formData.room && formData.professor) {
      setSchedules([...schedules, { ...formData, id: Date.now() }]);
      resetForm();
      setIsAdding(false);
    } else {
      alert('Please fill in all fields');
    }
  };

  const handleEdit = (schedule) => {
    setEditingId(schedule.id);
    setFormData({
      subject: schedule.subject,
      block: schedule.block,
      time: schedule.time,
      room: schedule.room,
      professor: schedule.professor
    });
  };

  const handleUpdate = () => {
    if (formData.subject && formData.block && formData.time && formData.room && formData.professor) {
      setSchedules(schedules.map(s => 
        s.id === editingId ? { ...formData, id: editingId } : s
      ));
      resetForm();
      setEditingId(null);
    } else {
      alert('Please fill in all fields');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      setSchedules(schedules.filter(s => s.id !== id));
    }
  };

  const handleCancel = () => {
    resetForm();
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold text-white">Class Schedule</h1>
          {!isAdding && !editingId && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition"
            >
              <Plus size={24} />
              Add Schedule
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className="bg-white rounded-lg p-6 mb-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-4">
              {isAdding ? 'Add New Schedule' : 'Edit Schedule'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-300 rounded px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Block</label>
                <input
                  type="text"
                  name="block"
                  value={formData.block}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-300 rounded px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., A, B, C"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Time</label>
                <input
                  type="text"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-300 rounded px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., 9:00 AM - 10:30 AM"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Room</label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-300 rounded px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Room 101"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-2">Professor</label>
                <input
                  type="text"
                  name="professor"
                  value={formData.professor}
                  onChange={handleInputChange}
                  className="w-full border-2 border-gray-300 rounded px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Dr. John Smith"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2 rounded flex items-center gap-2 transition"
              >
                <Save size={20} />
                {editingId ? 'Update' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-400 text-white font-bold px-6 py-2 rounded flex items-center gap-2 transition"
              >
                <X size={20} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Schedule List */}
        {schedules.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-xl">
            <p className="text-2xl text-gray-500">No schedules added yet</p>
            <p className="text-gray-400 mt-2">Click "Add Schedule" to create your first schedule</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 font-semibold mb-1">SUBJECT</p>
                      <p className="text-lg font-bold text-blue-900">{schedule.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-semibold mb-1">BLOCK</p>
                      <p className="text-lg font-bold text-blue-900">{schedule.block}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-semibold mb-1">TIME</p>
                      <p className="text-lg font-bold text-blue-900">{schedule.time}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-semibold mb-1">ROOM</p>
                      <p className="text-lg font-bold text-blue-900">{schedule.room}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-semibold mb-1">PROFESSOR</p>
                      <p className="text-lg font-bold text-blue-900">{schedule.professor}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded transition"
                      title="Edit"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="bg-red-600 hover:bg-red-500 text-white p-2 rounded transition"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}