import React, { useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Avatar, Tooltip, Switch
} from '@mui/material';
import { Block, CheckCircle, Delete } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers, toggleBlockUser } from '../../../redux/adminSlice';
import { deleteUser } from '../../../redux/adminSlice';
import Loader from '../../../components/Loader';

const ManageUsers = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.admin);

  useEffect(() => { dispatch(fetchAllUsers({})); }, [dispatch]);

  if (loading) return <Loader />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Manage Users ({users.length})
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Block/Unblock</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36, fontSize: 14 }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString('en-IN')}</TableCell>
                <TableCell>
                  <Chip
                    label={user.isBlocked ? 'Blocked' : 'Active'}
                    size="small"
                    color={user.isBlocked ? 'error' : 'success'}
                    icon={user.isBlocked ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={user.isBlocked ? 'Unblock User' : 'Block User'}>
                    <Switch
                      checked={!user.isBlocked}
                      onChange={() => dispatch(toggleBlockUser(user._id))}
                      color="success"
                    />
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ManageUsers;
