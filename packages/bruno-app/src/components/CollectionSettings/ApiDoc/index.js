import React, { useEffect, useState } from 'react';
import { useTheme } from 'providers/Theme';
import StyledWrapper from './StyledWrapper';

const ApiDoc = ({ collection }) => {
  const { storedTheme } = useTheme();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spec, setSpec] = useState(null);
  const [RedocComponent, setRedocComponent] = useState(null);

  useEffect(() => {
    const loadOpenApiSpec = async () => {
      try {
        setLoading(true);
        setError(null);

        const { ipcRenderer } = window;

        // Request the OpenAPI spec content from the backend
        const specData = await ipcRenderer.invoke('renderer:get-openapi-spec', collection.pathname);

        if (!specData) {
          setError('OpenAPI specification not found');
          setLoading(false);
          return;
        }

        // Dynamically import ReDoc
        const { RedocStandalone } = await import('redoc');

        setSpec(specData);
        setRedocComponent(() => RedocStandalone);
        setLoading(false);
      } catch (err) {
        console.error('Error loading OpenAPI spec:', err);
        setError(err.message || 'Failed to load OpenAPI documentation');
        setLoading(false);
      }
    };

    loadOpenApiSpec();
  }, [collection.pathname]);

  if (loading) {
    return (
      <StyledWrapper>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-muted">Loading API Documentation...</p>
          </div>
        </div>
      </StyledWrapper>
    );
  }

  if (error) {
    return (
      <StyledWrapper>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠</div>
            <p className="text-muted">{error}</p>
          </div>
        </div>
      </StyledWrapper>
    );
  }

  if (!RedocComponent || !spec) {
    return (
      <StyledWrapper>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted">No API documentation available</p>
          </div>
        </div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <RedocComponent
        spec={spec}
        options={{
          theme: storedTheme === 'dark' ? {
            colors: {
              primary: {
                main: '#569cd6'
              },
              success: {
                main: '#8cd656'
              },
              warning: {
                main: '#f59e0b'
              },
              error: {
                main: '#f06f57'
              },
              text: {
                primary: '#d4d4d4',
                secondary: '#9d9d9d'
              },
              border: {
                dark: '#444',
                light: '#585858'
              },
              responses: {
                success: {
                  color: '#8cd656',
                  backgroundColor: 'rgba(140, 214, 86, 0.1)'
                },
                error: {
                  color: '#f06f57',
                  backgroundColor: 'rgba(240, 111, 87, 0.1)'
                },
                redirect: {
                  color: '#f59e0b',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)'
                },
                info: {
                  color: '#569cd6',
                  backgroundColor: 'rgba(86, 156, 214, 0.1)'
                }
              },
              http: {
                get: '#8cd656',
                post: '#cd56d6',
                put: '#ee8133',
                options: '#ee8133',
                patch: '#ee8133',
                delete: '#f06f57',
                basic: '#999',
                link: '#31bbb6',
                head: '#c167e4'
              }
            },
            schema: {
              linesColor: '#444',
              defaultDetailsWidth: '75%',
              typeNameColor: '#569cd6',
              typeTitleColor: '#d4d4d4',
              requireLabelColor: '#f06f57',
              labelsTextSize: '0.9em',
              nestingSpacing: '1em',
              nestedBackground: 'rgba(255, 255, 255, 0.02)',
              arrow: {
                size: '1.1em',
                color: '#9d9d9d'
              }
            },
            typography: {
              fontSize: '14px',
              lineHeight: '1.5em',
              fontWeightRegular: '400',
              fontWeightBold: '600',
              fontWeightLight: '300',
              fontFamily: 'inherit',
              smoothing: 'antialiased',
              optimizeSpeed: true,
              headings: {
                fontFamily: 'inherit',
                fontWeight: '600',
                lineHeight: '1.6em'
              },
              code: {
                fontSize: '13px',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                lineHeight: '1.5em',
                fontWeight: '400',
                color: '#d4d4d4',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                wrap: false
              },
              links: {
                color: '#569cd6',
                visited: '#569cd6',
                hover: '#6aaae6'
              }
            },
            sidebar: {
              backgroundColor: '#252526',
              textColor: '#d4d4d4',
              activeTextColor: '#f59e0b',
              groupItems: {
                textTransform: 'uppercase'
              },
              level1Items: {
                textTransform: 'none'
              },
              arrow: {
                size: '1.5em',
                color: '#9d9d9d'
              }
            },
            logo: {
              maxHeight: '50px',
              maxWidth: '150px',
              gutter: '20px'
            },
            rightPanel: {
              backgroundColor: '#1e1e1e',
              textColor: '#d4d4d4',
              width: '40%'
            },
            codeBlock: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }
          } : {
            colors: {
              primary: {
                main: '#546de5'
              },
              success: {
                main: 'rgb(5, 150, 105)'
              },
              warning: {
                main: '#d97706'
              },
              error: {
                main: 'rgb(185, 28, 28)'
              },
              text: {
                primary: 'rgb(52, 52, 52)',
                secondary: '#838383'
              },
              border: {
                dark: '#efefef',
                light: '#f4f4f4'
              },
              responses: {
                success: {
                  color: 'rgb(5, 150, 105)',
                  backgroundColor: 'rgba(5, 150, 105, 0.1)'
                },
                error: {
                  color: 'rgb(185, 28, 28)',
                  backgroundColor: 'rgba(185, 28, 28, 0.1)'
                },
                redirect: {
                  color: '#d97706',
                  backgroundColor: 'rgba(217, 119, 6, 0.1)'
                },
                info: {
                  color: '#1663bb',
                  backgroundColor: 'rgba(22, 99, 187, 0.1)'
                }
              },
              http: {
                get: 'rgb(5, 150, 105)',
                post: '#8e44ad',
                put: '#ca7811',
                options: '#ca7811',
                patch: '#ca7811',
                delete: 'rgb(185, 28, 28)',
                basic: '#999',
                link: '#31bbb6',
                head: '#c167e4'
              }
            },
            schema: {
              linesColor: '#efefef',
              defaultDetailsWidth: '75%',
              typeNameColor: '#546de5',
              typeTitleColor: 'rgb(52, 52, 52)',
              requireLabelColor: 'rgb(185, 28, 28)',
              labelsTextSize: '0.9em',
              nestingSpacing: '1em',
              nestedBackground: 'rgba(0, 0, 0, 0.02)',
              arrow: {
                size: '1.1em',
                color: '#838383'
              }
            },
            typography: {
              fontSize: '14px',
              lineHeight: '1.5em',
              fontWeightRegular: '400',
              fontWeightBold: '600',
              fontWeightLight: '300',
              fontFamily: 'inherit',
              smoothing: 'antialiased',
              optimizeSpeed: true,
              headings: {
                fontFamily: 'inherit',
                fontWeight: '600',
                lineHeight: '1.6em'
              },
              code: {
                fontSize: '13px',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                lineHeight: '1.5em',
                fontWeight: '400',
                color: '#000',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                wrap: false
              },
              links: {
                color: '#1663bb',
                visited: '#1663bb',
                hover: '#2679d9'
              }
            },
            sidebar: {
              backgroundColor: '#F3F3F3',
              textColor: 'rgb(52, 52, 52)',
              activeTextColor: '#d97706',
              groupItems: {
                textTransform: 'uppercase'
              },
              level1Items: {
                textTransform: 'none'
              },
              arrow: {
                size: '1.5em',
                color: '#838383'
              }
            },
            logo: {
              maxHeight: '50px',
              maxWidth: '150px',
              gutter: '20px'
            },
            rightPanel: {
              backgroundColor: '#fff',
              textColor: 'rgb(52, 52, 52)',
              width: '40%'
            },
            codeBlock: {
              backgroundColor: '#f8f9fa'
            }
          },
          hideDownloadButton: true,
          disableSearch: false,
          hideLoading: true,
          nativeScrollbars: false,
          scrollYOffset: 0
        }}
      />
    </StyledWrapper>
  );
};

export default ApiDoc;
