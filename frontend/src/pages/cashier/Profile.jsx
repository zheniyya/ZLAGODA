import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { apiService } from '../../api/apiService';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user?.id) {
        apiService.getProfile(user.id).then(data => setProfile(data));
    }
  }, [user]);

  if (!profile) return <div className="p-6">Завантаження...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Особиста інформація</h2>
      <div className="bg-white p-8 rounded-lg shadow-sm max-w-2xl border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
          <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Прізвище та Ім'я</p>
              <p className="font-semibold text-lg">{profile.empl_surname} {profile.empl_name}</p>
          </div>
          <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">ID Працівника</p>
              <p className="font-mono bg-gray-100 inline-block px-2 py-1 rounded mt-1">{profile.id_employee}</p>
          </div>
          <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Телефон</p>
              <p className="text-lg">{profile.phone_number}</p>
          </div>
          <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Адреса</p>
              <p className="text-lg">{profile.city}, {profile.street}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;