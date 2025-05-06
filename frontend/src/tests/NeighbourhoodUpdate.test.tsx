import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NeighbourhoodUpdate from '../NeighbourhoodUpdate';
import axios from 'axios';

// Clean up after each test
afterEach(cleanup);

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock ForceGraph2D component
jest.mock('react-force-graph-2d', () => () => <div data-testid="mock-force-graph" />);

// Spy on alerts
const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

describe('NeighbourhoodUpdate component', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({
      data: {
        nodes: ['0', '1'],
        edges: [['0', '1']],
        graph_type: 'Complete Graph',
        num_nodes: 2,
        num_edges: 1
      }
    });
  });

  it('renders the component with graph info and inputs', async () => {
    render(<NeighbourhoodUpdate />);

    await waitFor(() => {
      expect(screen.getByText(/Graph G \(Complex Graph\)/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Biclique size/i)).toBeInTheDocument();
    const [bicliqueInput, iterationInput] = screen.getAllByRole('spinbutton');
    expect(bicliqueInput).toHaveValue(3);
  });

  it('updates biclique size input', async () => {
    render(<NeighbourhoodUpdate />);
    const input = screen.getByLabelText(/Biclique size/i);
    await userEvent.clear(input);
    await userEvent.type(input, '5');
    expect(input).toHaveValue(5);
  });

  it('calls backend on Generate Biclique click', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        homomorphism: { '0': '0', '1': '1' }
      }
    });

    render(<NeighbourhoodUpdate />);
    const generateButton = await screen.findByRole('button', { name: /Generate Biclique/i });
    await userEvent.click(generateButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:5000/generate_biclique', {
        set1_size: 3,
        set2_size: 3
      });
    });
  });

  it('handles single update call success', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        homomorphism: { '0': '0', '1': '1' },
        success: true,
        selected_S: '0',
        selected_G: '1',
        homomorphic_edges: [['0', '1']]
      }
    });

    render(<NeighbourhoodUpdate />);
    const updateButton = await screen.findByRole('button', { name: /Update Homomorphism \(Single Step\)/i });
    await userEvent.click(updateButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:5000/update_homomorphism_neighbourhood');
    });
  });

  it('displays error on update failure', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        homomorphism: {},
        success: false,
        message: 'No valid neighbor'
      }
    });

    render(<NeighbourhoodUpdate />);
    const updateButton = await screen.findByRole('button', { name: /Update Homomorphism \(Single Step\)/i });
    await userEvent.click(updateButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('No valid neighbor');
    });
  });
});
