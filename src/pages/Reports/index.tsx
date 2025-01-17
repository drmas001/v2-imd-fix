import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { useUserStore } from '../../stores/useUserStore';
import ActiveCasesDashboard from './ActiveCasesDashboard';
import DailyReports from '../DailyReports';
import LongStayReports from '../../components/Reports/LongStayReports';
import DepartmentStats from './DepartmentStats';
import AdminReports from '../../components/Reports/AdminReports';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('active-cases');
  const { currentUser } = useUserStore();
  const isAdmin = currentUser?.role === 'administrator';

  return (
    <div className="flex-1 p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-gray-200 rounded-lg p-1">
          <TabsTrigger value="active-cases">Active Cases</TabsTrigger>
          <TabsTrigger value="daily">Daily Reports</TabsTrigger>
          <TabsTrigger value="long-stay">Long Stay Reports</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin">Admin Reports</TabsTrigger>}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="active-cases">
            <ActiveCasesDashboard />
          </TabsContent>

          <TabsContent value="daily">
            <DailyReports />
          </TabsContent>

          <TabsContent value="long-stay">
            <LongStayReports />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminReports />
            </TabsContent>
          )}

          <TabsContent value="departments">
            <div>Department statistics are currently unavailable.</div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Reports;