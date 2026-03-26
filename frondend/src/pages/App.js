<Route path="/" element={<Layout />}>
  <Route index element={<Navigate to="/dashboard" />} />
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="scans" element={<Scans />} />
  <Route path="scans/:id" element={<ScanDetails />} />
  <Route path="targets" element={<Targets />} />
  <Route path="findings" element={<Findings />} />
  <Route path="reports" element={<Reports />} />
  <Route path="automation" element={<Automation />} />
  <Route path="compliance" element={<Compliance />} />
  <Route path="integrations" element={<Integrations />} />
  <Route path="monitoring" element={<Monitoring />} />
  <Route path="settings" element={<Settings />} />
</Route>